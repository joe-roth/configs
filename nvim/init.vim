filetype plugin indent on    " required
syntax on

call plug#begin('~/.local/share/nvim/plugged')
Plug 'fatih/vim-go' " Amazing combination of features.
Plug 'scrooloose/nerdtree'        "Tree explorer
Plug 'tpope/vim-surround'         "Enclose group
Plug 'scrooloose/nerdcommenter'   "Auto-comment groups
Plug 'jistr/vim-nerdtree-tabs'    "Nerdtree is independent of tabs
Plug 'Raimondi/delimitMate'       "Auto-close quotes, tabs, etc
Plug 'kien/ctrlp.vim'             "Open files with Ctrl-p
Plug 'garyburd/go-explorer'       "Explore documentation of go package
Plug 'airblade/vim-gitgutter'     "Show git edits in gutter
Plug 'Shougo/deoplete.nvim', { 'do': ':UpdateRemotePlugins' }
Plug 'nsf/gocode'
Plug 'zchee/deoplete-go', {'build': {'unix': 'make'}}
Plug 'SirVer/ultisnips'           "Code snippets
Plug 'honza/vim-snippets'
Plug 'jodosha/vim-godebug' " Debugger integration via delve
Plug 'tpope/vim-fugitive'
Plug 'tomlion/vim-solidity'
"Plug 'Tabmerge'                   "Merge tab into pane
"Plug 'Tagbar'                     "Show functions, methods, objects, etc
"Plug 'pearofducks/ansible-vim'    "Yaml syntax highlighting
call plug#end()

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

" close quickfix
map <C-n> :cnext<CR>
map <C-b> :cprevious<CR>
nnoremap <leader>a :cclose<CR>

au BufEnter * call MyLastWindow()
function! MyLastWindow()
  " if the window is quickfix go on
  if &buftype=="quickfix"
    " if this window is last on screen quit without warning
    if winbufnr(2) == -1
      quit!
    endif
  endif
endfunction

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

set wrap
set linebreak
set nolist  " list disables linebreak

"set tw=80 " truncates lines to 80 chars
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

autocmd QuickFixCmdPost *grep* cwindow "Calling grep will automatically open quickfix window

" ----------------------------------------- "
"             Plugin configs 			    			"
" ----------------------------------------- "

" ==================== UltiSnips ====================
"let g:UltiSnipsUsePythonVersion = 3
"let g:UltiSnipsExpandTrigger="<tab>"
"let g:UltiSnipsJumpForwardTrigger="<tab>"
"let g:UltiSnipsJumpBackwardTrigger="<s-tab>"
"let g:UltiSnipsSnippetDirectories=$HOME.'/.config/nvim/vim-snippets'
"let g:UltiSnipsSnippetsDir=$HOME.'/.config/nvim/custom'

" ==================== Deoplete ====================
let g:deoplete#enable_at_startup = 1
"let g:deoplete#disable_auto_complete = 1

" ==================== CtrlP ====================
let g:ctrlp_working_path_mode = 'ra' " set root based on nearest .git ancestor
let g:ctrlp_max_height = 10		" maxiumum height of match window
let g:ctrlp_switch_buffer = 'et'	" jump to a file if it's open already
let g:ctrlp_mruf_max=450 		" number of recently opened files
let g:ctrlp_max_files=0  		" do not limit the number of searchable files

" ==================== NerdTree Config ===========
nmap <silent> <leader>n :NERDTreeTabsToggle<CR>
"let g:nerdtree_tabs_open_on_console_startup = 1

" ==================== Vim-go ====================
" run :GoBuild or :GoTestCompile based on the go file
function! s:build_go_files()
  let l:file = expand('%')
  if l:file =~# '^\f\+_test\.go$'
    call go#cmd#Test(0, 1)
  elseif l:file =~# '^\f\+\.go$'
    call go#cmd#Build(0)
  endif
endfunction

let g:go_metalinter_autosave = 1
let g:go_auto_type_info = 1
let g:go_auto_sameids = 1
let g:go_list_type = "quickfix"
let g:go_def_reuse_buffer = 1

autocmd BufRead,BufNewFile *.go setlocal tw=80 formatoptions+=w
autocmd FileType go nmap <leader>b :<C-u>call <SID>build_go_files()<CR>
au FileType go nmap gp <Plug>(go-def-vertical)
au FileType go nmap gv <Plug>(go-doc-vertical)
au FileType go nmap <Leader>r <Plug>(go-run)
au FileType go nmap <leader>t <Plug>(go-test)
au FileType go nmap <leader>tf <Plug>(go-test-func)
au FileType go nmap <Leader>tc <Plug>(go-coverage-toggle)
au FileType go nmap <Leader>i <Plug>(go-imports)
au FileType go nmap <Leader>d :GoDeclsDir<CR>

autocmd Filetype go command! -bang A call go#alternate#Switch(<bang>0, 'edit')
autocmd Filetype go command! -bang AV call go#alternate#Switch(<bang>0, 'vsplit')
autocmd Filetype go command! -bang AS call go#alternate#Switch(<bang>0, 'split')
autocmd Filetype go command! -bang AT call go#alternate#Switch(<bang>0, 'tabe')

" ==================== DelimitMate ====================
let g:delimitMate_expand_cr = 1
let g:delimitMate_expand_space = 1
