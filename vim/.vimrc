"This is my default vimrc file
set number "show line numbers
map LL l
map HH h
map JJ j
map KK k
nmap <silent> <c-n> :NERDTreeToggle<CR>
map = /^\s*$<CR>
map + ?^\s*$<CR>
set pastetoggle=<F2>
command W w

"make hjkl movements accessible from insert mode via the <Alt> modifier key
inoremap <C-h> <C-o>h
inoremap <C-j> <C-o>j
inoremap <C-k> <C-o>k
inoremap <C-l> <C-o>l
inoremap <C-b> <C-o>b
inoremap <C-w> <C-o>w
inoremap <C-n> <C-o>$

"autoclose things
imap { {}<left>
imap [ []<left>
inoremap ' ''<LEFT>
inoremap " ""<LEFT>
imap ( ()<left>

"to run jslint
nmap <F4> :w<CR>:make<CR>:cw<CR>

"tlist things
let g:tlist_javascript_settings = 'javascript;f:function'
let Tlist_Use_Right_Window = 1
let Tlist_Enable_Fold_Column = 0
nnoremap <F3> :TlistToggle<CR>

nnoremap <Leader>s :s/<C-r><C-w>/

"perl shortcuts
nnoremap <Leader>n :s/;$/\."\\n";/<CR>
nnoremap <Leader>u :'<,'>s/\%V\(.*\)\%V/unpack\("H\*",\1\)/<CR>


set nocompatible "don't need to keep compatibility with Vi

filetype plugin indent on "enable detection, plugins and indenting in one step
syntax on "Turn on syntax highlighting


set showcmd "show incomplete cmds down the bottom
set showmode "show current mode down the bottom
set foldenable "enable folding
set showmatch "set show matching parenthesis

"set noexrc " don't use the local config

""set virtualedit=all "allow the cursor to go in to "invalid" places

set incsearch "find the next match as we type the search
"set hlsearch "hilight searches by default
set ignorecase "ignore case when searching

set shiftwidth=4 "number of spaces to use in each autoindent step
set tabstop=2 "two tab spaces
set softtabstop=2 "number of spaces to skip or insert when <BS>ing or <Tab>ing
set expandtab "spaces instead of tabs for better cross-editor compatibility
set smarttab "use shiftwidth and softtabstop to insert or delete (on <BS>) blanks
"set cindent "recommended seting for automatic C-style indentation
set autoindent "automatic indentation in non-C files
set nowrap "no wrapping
set copyindent "copy the previous indentation on autoindenting
set backspace=indent,eol,start "allow backspacing over everything in insert mode

set noerrorbells "don't make noise
set shiftround "when at 3 spaces, and I hit > ... go to 4, not 5

set cursorline "underline the current line in the file
"set cursorcolumn "highlight the current column. Visible in GUI mode only.

set wildmenu "make tab completion act more like bash
set wildmode=list:longest "tab complete to longest common string, like bash

"set mouse-=a "disable mouse automatically entering visual mode
set mouse=a "Enable mouse support in the terminal VIM and activate visual mode with dragging

set wrap! "Word wrap on
set bs=2
set hidden "allow hiding buffers with unsaved changes
set cmdheight=2 "make the command line a little taller to hide "press enter to viem more" text

set clipboard=unnamedplus
