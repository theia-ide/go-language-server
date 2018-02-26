# A Go Language Server based on the Go Extension for Visual Studio Code

Wraps the VSCode Go extension from Microsoft into a language server, such that
its functionality can be reused with other LSP-aware clients.

In the first iteration we will mock VSCode APIs or simulate their behavior
backed by an LSP. We will maintain this as a fork of the original repository
such that we can easily pick up incoming improvements of that by just rebasing.
Once we got more confidence, we'd probably refactor the VSCode specific parts
away.

[Original README.md](README_old.MD).

## Mismatches and Challenges

- There is no such thing as the `activeTextEditor` in LSP. For services that
  have a `TextDocumentItem`, we set it before calling the service impl, but for
  other services, e.g. `executeCommand` we cannot make sure that they are
  performed on the correct document.
- We have to use/mock/adapt a lot of global variables

## Prerequisites

Make sure the `go` command is available from your path and that the GOPATH
environment variable points to where your go packages are installed.  Some go
packages are necessary:

    go get -v github.com/nsf/gocode
    go get -v github.com/uudashr/gopkgs/cmd/gopkgs
    go get -v github.com/ramya-rao-a/go-outline
    go get -v github.com/acroca/go-symbols
    go get -v golang.org/x/tools/cmd/guru
    go get -v golang.org/x/tools/cmd/gorename
    go get -v github.com/fatih/gomodifytags
    go get -v github.com/haya14busa/goplay/cmd/goplay
    go get -v github.com/josharian/impl
    go get -v github.com/tylerb/gotype-live
    go get -v github.com/rogpeppe/godef
    go get -v golang.org/x/tools/cmd/godoc
    go get -v github.com/zmb3/gogetdoc
    go get -v golang.org/x/tools/cmd/goimports
    go get -v sourcegraph.com/sqs/goreturns
    go get -v github.com/golang/lint/golint
    go get -v github.com/cweill/gotests/...
    go get -v github.com/alecthomas/gometalinter
    go get -v honnef.co/go/tools/...
    go get -v github.com/sourcegraph/go-langserver
    go get -v github.com/derekparker/delve/cmd/dlv

Note: this list comes from
[here](https://github.com/theia-ide/go-language-server/blob/master/src/goInstallTools.ts#L20-L42).

## Build and usage

1. Run `npm install` to install the package dependencies.
2. Run `npm run compile` to compile the Typescript to Javascript.
3. Run the server with `node ./out/src-vscode-mock/cli.js --stdio`.
