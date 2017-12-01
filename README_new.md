# A Go Language Server based on the Go Extension for Visual Studio Code

Wraps the VSCode Go extension from Microsoft into a language server, such that its functionality can be reused with other LSP-aware clients.

In the first iteration we will mock VSCode APIs or simulate their behavior backed by an LSP. We will maintain this as a fork of the original repository such that we can easily pick up incoming improvements of that by just rebasing. Once we got more confidence, we'd probably refactor the VSCode specific parts away.

[Original README.md](README_old.MD).

## Mismatches and Challenges

- There is no such thing as the `activeTextEditor` in LSP. For services that have a `TextDocumentItem`, we set it before calling the service impl, but for other services, e.g. `executeCommand` we cannot make sure that they are performed on the correct document.
- We have to use/mock/adapt a lot of global variables


