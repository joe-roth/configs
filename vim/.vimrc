set shell=/bin/bash " when using fish, vim will need /bin/sh shell for things to work
set nocompatible              " be iMproved, required
filetype off                  " required
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()

Plugin 'fatih/vim-go' 
Plugin 'Valloric/YouCompleteMe'
Plugin 'scrooloose/nerdtree'
Plugin 'tpope/vim-surround'
Plugin 'scrooloose/nerdcommenter'
Plugin 'jistr/vim-nerdtree-tabs'
Plugin 'kien/ctrlp.vim'
Plugin 'Tagbar'
Plugin 'Raimondi/delimitMate'
Plugin 'SirVer/ultisnips'
Plugin 'ervandew/supertab'
Plugin 'honza/vim-snippets'
Plugin 'fugitive.vim'
Plugin 'Tabmerge'
Plugin 'Syntastic'

call vundle#end()            " required
filetype plugin indent on    " required
syntax on

" ========== Custom Key Bindings ==========="
" Better split switching
map <C-j> <C-W>j
map <C-k> <C-W>k
map <C-h> <C-W>h
map <C-l> <C-W>l

" Fast saving, quitting
nmap <leader>w :w!<cr>
nnoremap <leader>q :q<CR>

" Center the screen
nnoremap <space> zz

" Just go out in insert mode
imap jk <ESC>l

" common shortcuts
cabbrev t tabnew
cabbrev reload so %
cmap w!! %!sudo tee > /dev/null %

" replace thing under cursor globally from cursor position to end of line
nnoremap <leader>p :<c-u>s/\%><c-r>=col(".")-1<cr>c<c-r><c-w>//g<left><left>
nnoremap <Leader>s :s/<C-r><C-w>/
nnoremap <Leader>g :Ggrep <C-r><C-w><CR>

"========== Vim Configuration ==========  
" general stuff
set noerrorbells                " No beeps
set number                      " Show line numbers
set backspace=indent,eol,start  " Makes backspace key more powerful.
set showcmd                     " Show me what I'm typing
set showmode                    " Show current mode.
set noswapfile                  " Don't use swapfile
set nobackup            	" Don't create annoying backup files
set splitright                  " Split vertical windows right to the current windows
set splitbelow                  " Split horizontal windows below to the current windows
set encoding=utf-8              " Set default encoding to UTF-8
set autowrite                   " Automatically save before :next, :make etc.
set autoread                    " Automatically reread changed files without asking me anything
set laststatus=2
set fileformats=unix,dos,mac    " Prefer Unix over Windows over OS 9 formats
set switchbuf+=usetab,newtab " when switching to new buffer (like from quickfix), go to existing tab or open new

" autocmd QuickFixCmdPost *grep* cwindow " Automaticaly open quickfix window after grep commands

set tw=80 " truncates lines to 80 chars
set formatoptions+=w " truncate at word breaks

"http://stackoverflow.com/questions/20186975/vim-mac-how-to-copy-to-clipboard-without-pbcopy
set clipboard^=unnamed 
set clipboard^=unnamedplus

" Search stuff
" Remove search highlight
nnoremap <leader><space> :nohlsearch<CR>
set noshowmatch                 " Do not show matching brackets by flickering
set nocursorcolumn
set lazyredraw          	    " Wait to redraw "
set incsearch                   " Shows the match while typing
set hlsearch                    " Highlight found searches
set ignorecase                  " Search case insensitive...
set smartcase                   " ... but not when search pattern contains upper case characters
set ttyfast 

" Tab stuff
set shiftwidth=2 	"number of spaces to use in each autoindent step
set tabstop=2 		"two tab spaces
set softtabstop=2 	"number of spaces to skip or insert when <BS>ing or <Tab>ing
set expandtab 		"spaces instead of tabs for better cross-editor compatibility
set smarttab 		"use shiftwidth and softtabstop to insert or delete (on <BS>) blanks
set autoindent 		"automatic indentation in non-C files
set copyindent 		"copy the previous indentation on autoindenting

" speed up syntax highlighting
set nocursorcolumn
set nocursorline
syntax sync minlines=256
set synmaxcol=128
set re=1

" ----------------------------------------- "
"             Plugin configs 			    			"
" ----------------------------------------- "

" ==================== CtrlP ====================
let g:ctrlp_working_path_mode = 'ra' " set root based on nearest .git ancestor
let g:ctrlp_max_height = 10		" maxiumum height of match window
let g:ctrlp_switch_buffer = 'et'	" jump to a file if it's open already
let g:ctrlp_mruf_max=450 		" number of recently opened files
let g:ctrlp_max_files=0  		" do not limit the number of searchable files

" ==================== NerdTree Config ===========
nmap <silent> <leader>n :NERDTreeTabsToggle<CR>
"nmap <silent> <leader>n :NERDTreeToggle<CR>


" ==================== Vim-go ====================
"autocmd BufWritePre *.go call go#lint#Run()
let g:syntastic_go_checkers = ['go', 'golint', 'errcheck']
"autocmd BufWritePre *.go :GoLint
au FileType go nmap <Leader>gv <Plug>(go-doc-vertical)
"au FileType go nmap gd <Plug>(go-def)
"au FileType go nmap <Leader>d <Plug>(go-def-split):resize 10<CR>zb
au FileType go nmap <Leader>v <Plug>(go-def-vertical)
au FileType go nmap <Leader>t <Plug>(go-def-tab)
au FileType go nmap <Leader>i <Plug>(go-info)
au FileType go nmap <Leader>r <Plug>(go-run)
au FileType go nmap <Leader>b <Plug>(go-build)
au FileType go nmap <Leader>d <Plug>(go-doc)
au FileType go nmap <Leader>i :GoImports<CR>
set rtp+=$GOPATH/src/github.com/golang/lint/misc/vim

" ==================== Tagbar ====================
nmap <F8> :TagbarToggle<CR>

" ==================== DelimitMate ====================
let g:delimitMate_expand_cr = 1
let g:delimitMate_expand_space = 1

" ==================== You Complete Me  ====================
" make YCM compatible with UltiSnips (using supertab)
let g:ycm_key_list_select_completion = ['<C-n>', '<Down>']
let g:ycm_key_list_previous_completion = ['<C-p>', '<Up>']
let g:SuperTabDefaultCompletionType = '<C-n>'

" ==================== UltiSnips ====================
" better key bindings for UltiSnipsExpandTrigger
let g:UltiSnipsExpandTrigger = "<tab>"
let g:UltiSnipsJumpForwardTrigger = "<tab>"
let g:UltiSnipsJumpBackwardTrigger = "<s-tab>"

