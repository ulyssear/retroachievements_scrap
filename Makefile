ifeq ($(OS),Windows_NT) 
    detected_OS := Windows
else
    detected_OS := $(shell sh -c 'uname 2>/dev/null || echo Unknown')
endif

init:
ifeq ($(detected_OS),Windows)
	@set EXECUTABLE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
else
	@export EXECUTABLE_PATH=/usr/bin/google-chrome
endif


start: init
	npm run build
	npm start -- --executable_path=$(EXECUTABLE_PATH)