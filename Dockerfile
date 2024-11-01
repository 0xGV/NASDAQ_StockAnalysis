FROM golang:1.15.7-buster

RUN go get -u github.com/gin-gonic/gin

ENV GO111MODULE=on
ENV GOFLAGS=-mod=vendor
ENV APP_USER app
ENV APP_HOME /go/src/stockscreener

ARG GROUP_ID
ARG USER_ID

RUN groupadd --gid $GROUP_ID app && useradd -m -l --uid $USER_ID --gid $GROUP_ID $APP_USER
RUN mkdir -p $APP_HOME && chown -R $APP_USER:$APP_USER $APP_HOME

COPY main.go $APP_HOME/

RUN cd $APP_HOME/ && go mod init mathapp && go mod tidy && go mod vendor

USER $APP_USER
WORKDIR $APP_HOME
EXPOSE 8080
CMD ["go", "run", "main.go"]
