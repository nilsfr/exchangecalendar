version = $(shell cat VERSION)
excludefromxpi = .git/\* .tx/\* \*.xpi \*.sh update\*.txt Makefile VERSION

# Default target is build package
build:
	# Update version number inside install.rdf file from VERSION file
	sed -i 's/\(\s*\)<em:version>[^<]*\?<\/em:version>/\1<em:version>$(version)<\/em:version>/' install.rdf
	# Disable automatic updates of the extension
	cat defaults/preferences/update_disable.txt > defaults/preferences/update.js
	# Finally, create the xpi file
	zip -r exchangecalendar-v"$(version)".xpi -x $(excludefromxpi) -- . 

# Target to beautify and build your code while developing it
dev: beautify build

# Beautifier are configured to use indentation with 4 spaces
beautify: beautify-xml beautify-js

beautify-xml:
	find \( -name "*.xml" -o -name "*.rdf" -o -name "*.xul" \) -exec \
		tidy --input-xml yes --indent auto --indent-spaces 4 --indent-attributes yes \
		--preserve-entities yes --quote-ampersand no --quote-nbsp no --output-xml yes \
		--strict-tags-attributes no --write-back yes \
		 {} \;
beautify-js:
	find -name "*.js" -exec \
		js-beautify --indent-size=4 --indent-char=' ' --jslint-happy \
		--operator-position after-newline --brace-style end-expand --replace \
		{} \;
