IMAGE=quay.io/vpavlin0/podex-downloader

build:
	go build -o _build/podex-downloader main.go

dev:
	go run main.go

container: build
	docker build -t $(IMAGE) .

push: container
	docker push $(IMAGE)

run:
	docker run -it --rm --name podex-downloader -p 9090:9090 -e PODEX_CODEX_URL=http://172.17.0.1:8080 $(IMAGE)

