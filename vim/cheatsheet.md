# Vim Plugins

## NerdTree

When cursor is over file:
	go - preview file (cursor stays in tree)
	<enter> - open file in current buffer
	t - open in new tab
	s - open in vertical split
	i - open in horizontal split

	p - place cursor on parent dir
	P - place cursor on root dir

When cursor on dir
	C - change tree root to selected dir
	U - move tree root up a dir

R - refresh
I - show hidden files

## Ctrlp

ctrl-p - open

Once open:
	- ctrl-d - switch between filename and full path search
	- ctrl-f - switch between search modes (buffer, file, or Most Recently Used (MRU))
	- ctrl-j/k - navigate list
	- ctrl-t/v/x - open file in tab, vert spli, horixontal split

## Vim-go

:GoInstallBinaries, :GoUpdateBinaries

\b - build, and open quickfix window with build errors
	
\t - runs go test
\tf - when cursor is over TestFoo, only runs the test foo

\tc - run code testing coverage (run again to clear the coverage)

:A, :AS, :AV, :AT - opens test file (or main file) in split

gd - go to definition of something
ctrl-t - go back from definition

\d - open declarations ctrl-p to search for different declarations

K - in normal mode, will get documentation for thing under cursor

:GeDoc "fmt" - will open documentation for fmt package
:GoPlay - auto upload code to playground

Refactor
	:GoRename "sub" - will rename identifiers under cursor call (super powerful)
	:GoFreevars - run on a selection of code, will show which variables exist within the block
	:GoImpl <interface> - will generate code for a type which implements na interface

Guru Things:
	:GoReferrers - will show all referers to the word under cursor
	:GoDescribe - will show info of the thing under cursor (super helpful)
	:GoImplements - which interfaces does this thing implement?
	:GoWhicherrs - what types of errors are returned?
	:GoChannelPeers - where are channel references?
	:GoCallees - Possible targets of a selected function call
	:GoCallers - Places which call a function

