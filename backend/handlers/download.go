package handlers

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"sync"

	"github.com/gin-gonic/gin"
)

// DownloadHandler handles the download request
func DownloadHandler(c *gin.Context) {
	url := c.Query("url")
	if url == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "URL parameter is required"})
		return
	}

	// Set the header for SSE
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	// Execute yt-dlp command with output to a file
	cmd := exec.Command("./bin/yt-dlp_linux", "--newline", "--remux-video", "webm", "-o", "-", url)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get stdout"})
		return
	}

	stderr, err := cmd.StderrPipe()

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get stderr"})
		return
	}

	if err := cmd.Start(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start download"})
		return
	}

	// Stream the progress to the client
	wg := sync.WaitGroup{}
	wg.Add(1)
	go func() {
		defer cmd.Wait()
		defer wg.Done()

		// Parse and stream progress updates
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			line := scanner.Text()
			c.Writer.Write([]byte(fmt.Sprintf("%s\n", line)))
			c.Writer.Flush()
			log.Println(line)
		}

		// Check if there were any errors
		if err := scanner.Err(); err != nil {
			log.Printf("Error reading stderr: %s", err)
			c.Writer.Write([]byte("Error parsing yt-dlp output\n\n"))
			c.Writer.Flush()
			cmd.Process.Kill()
			return
		}

		// Send completion message
		c.Writer.Write([]byte("[END] \n\n"))
		c.Writer.Flush()
		log.Println("Download completed successfully")
	}()

	codexURL := os.Getenv("PODEX_CODEX_URL")
	if codexURL == "" {
		codexURL = "http://localhost:8080"
	}
	log.Println(codexURL)
	req, err := http.NewRequest("POST", fmt.Sprintf("%s/api/codex/v1/data", codexURL), stdout)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request"})
		return
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send request"})
		return
	}
	defer resp.Body.Close()

	cid, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read response body"})
		return
	}

	fmt.Println("CID: ", string(cid))
	c.Writer.Write([]byte(fmt.Sprintf("[CID] %s\n", string(cid))))
	c.Writer.Flush()

	wg.Wait()
}

func FetchManifest(c *gin.Context) {
	url := c.Query("url")
	if url == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "URL parameter is required"})
		return
	}

	cmd := exec.Command("./bin/yt-dlp_linux", "-j", url)
	data, err := cmd.Output()

	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch manifest"})
		return
	}

	cmd.Wait()

	if err != nil {
		log.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read output"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": string(data)})
}
