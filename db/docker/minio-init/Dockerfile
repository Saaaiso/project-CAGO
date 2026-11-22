FROM golang:latest AS build
RUN go install github.com/minio/mc@latest

FROM alpine:latest
RUN apk add --no-cache ca-certificates
COPY --from=build /go/bin/mc /usr/local/bin/mc
