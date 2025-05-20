IMAGE = quay.io/vpavlin0/podex

all: push

build:
	npm run build
container: build
	docker build -t $(IMAGE) .
push: container
	docker push $(IMAGE)
run:
	docker run -it --rm -p 9090:80 $(IMAGE)