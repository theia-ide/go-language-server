# State of command migration

|command|title|description|status|comment|
|--------------------|
| `go.gopath` | Current GOPATH | See the currently set GOPATH. |  | |
| `go.add.tags` | Add Tags To Struct Fields | Add tags configured in go.addTags setting to selected struct using gomodifytags | ready | |
| `go.remove.tags` | Remove Tags From Struct Fields | Remove tags configured in go.removeTags setting from selected struct using gomodifytags | ready | |
| `go.impl.cursor` | Generate Interface Stubs | Generates method stub for implementing the provided interface and inserts at the cursor. | ignored | cannot prompt for interface name |
| `go.test.cursor` | Test Function At Cursor | Runs a unit test at the cursor. | ignored | depends on goCover, decorations not supported |
| `go.benchmark.cursor` | Benchmark Function At Cursor | Runs a benchmark at the cursor. | ignored | depends on goCover, decorations not supported |
| `go.test.package` | Test Package | Runs all unit tests in the package of the current file. | ignored | depends on goCover, decorations not supported |
| `go.test.file` | Test File | Runs all unit tests in the current file. | ignored | depends on goCover, decorations not supported | 
| `go.test.workspace` | Test All Packages In Workspace | Runs all unit tests from all packages in the current workspace. | ignored | depends on goCover, decorations not supported |
| `go.test.previous` | Test Previous | Re-runs the last executed test. | ignored | depends on goCover, decorations not supported |
| `go.test.coverage` | Toggle Test Coverage In Current Package | Displays test coverage in the current package. | ignored | depends on goCover, decorations not supported | 
| `go.tests.showOutput` | |||
| `go.import.add` | Add Import | Add an import declaration | mapped | |
| `go.tools.install` | Install/Update Tools | install/update the required go packages | to be mapped | |
| `go.browse.packages` | Browse Packages | Browse packages and Go files inside the packages. | ignored | cannot open editors |
| `go.test.generate.package` | Generate Unit Tests For Package | Generates unit tests for the current package | ready | |
| `go.test.generate.file` | Generate Unit Tests For File | Generates unit tests for the current file | ready | |
| `go.test.generate.function` | Generate Unit Tests For Function | Generates unit tests for the selected function in the current file | ready | |
| `go.toggle.test.file` | Toggle Test File | Toggles between file in current active editor and the corresponding test file. | ignored | cannot open editors |
| `go.debug.startSession`||||
| `go.show.commands` | Show All Commands... | Shows all commands from the Go extension in the wuick pick | mapped | test when prompting is available |
| `go.get.package` | Get Package | Run `go get -v` on the package on the current line. | mapped | test when oputput channel is available |
| `go.playground` | Run on Go Playground | Upload the current selection or file to the Go Playground | mapped | untested |
| `go.lint.package` | Lint Current Package | Run linter in the package of the current file. | mapped | |
| `go.lint.workspace` | Lint Workspace | Run linter in the current workspace. | mapped | |
| `go.vet.package` | Vet Current Package | Run go vet in the package of the current file. | mapped | |
| `go.vet.workspace` | Vet Workspace | Run go vet in the current workspace. | mapped | |
| `go.build.package` | Build Current Package | Build the package of the current file. | mapped | |
| `go.build.workspace` | Build Workspace | Build the current workspace. | mapped | |
| `go.install.package` | Install Current Package | Install the current package. | mapped |
| `go.promptforinstall`| |||