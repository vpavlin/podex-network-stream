package main

import (
	"time"

	"bloxy.one/podex/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.Use(gin.HandlerFunc(gin.Logger()))
	r.Use(gin.Recovery())
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	v1 := r.Group("api/v1")
	{
		v1.GET("/download", handlers.DownloadHandler)
		v1.GET("/manifest", handlers.FetchManifest)
	}

	r.Run(":9090") // listen and serve on 0.0.0.0:8080
}
