FROM fedora:42

RUN dnf install -y ffmpeg

RUN curl -L -o /bin/yt-dlp_linux https://github.com/yt-dlp/yt-dlp/releases/download/2025.05.22/yt-dlp_linux &&\
    chmod +x /bin/yt-dlp_linux

ADD _build/podex-downloader /opt

ENTRYPOINT ["/opt/podex-downloader"]