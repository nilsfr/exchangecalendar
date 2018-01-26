version = $(shell cat VERSION)
excludefromxpi = .git/\* .gitignore \*/.gitignore .tx/\* \*.xpi \*.sh update\*.txt Makefile VERSION install.rdf.template
releasebranch = ec-4.0
update = disable
xpi = exchangecalendar-v$(version).xpi

.PHONY: build release l10n-get l10n-auto-commit l10n-push dev beautify beautify-xml beautify-js defaults/preferences/update.js $(xpi)

# Default target is build package
build: $(xpi)

$(xpi): install.rdf defaults/preferences/update.js
	rm -f $@
	zip -r $@ -x $(excludefromxpi) -- .

install.rdf: install.rdf.template
	sed 's/@VERSION@/$(version)/g' $< > $@

defaults/preferences/update.js:
	cp defaults/preferences/update_$(update).txt $@

# Target to publish a new release:
release: l10n-auto-commit build
	git tag "v$(version)"
	@echo 'Translations updated, build done, tag added.'
	@echo 'Now, if the release is well done, please run one "git push" to publish code and one "git push v$(version)" to publish the new tag.'

# Targets to update translations
# Requires an already configured Transifex client: https://docs.transifex.com/client/introduction
# This project has a .tx/ directory which references currently known localisation files

# Get translations updates from Transifex
l10n-get:
	git checkout $(releasebranch)
	tx pull -a

l10n-auto-commit: l10n-get
	git add -- locale interfaces/exchangeAddressBook/locale/
	-git commit -m 'l10n: automatic translations updates'

# Send new texts to translate to Transifex
l10n-push:
	git checkout $(releasebranch)
	tx push

# Target to beautify and build your code while developing it
dev: beautify build

# Beautifier are configured to use indentation with 4 spaces
beautify: beautify-xml beautify-js

beautify-xml:
	find \( -name "*.xml" -o -name "*.xul" \) -exec \
		tidy --input-xml yes --indent auto --indent-spaces 4 --indent-attributes yes \
		--preserve-entities yes --quote-ampersand no --quote-nbsp no --output-xml yes \
		--strict-tags-attributes no --write-back yes \
		{} \;
	# For rdf files, we don't want to wrap lines to keep em:description on one line.
	find -name "*.rdf" -exec \
		tidy --input-xml yes --indent auto --indent-spaces 4 --indent-attributes yes \
		--preserve-entities yes --quote-ampersand no --quote-nbsp no --output-xml yes \
		--strict-tags-attributes no --write-back yes --wrap 0 \
		{} \;
beautify-js:
	find -name "*.js" -exec \
		js-beautify --indent-size=4 --indent-char=' ' --jslint-happy \
		--operator-position after-newline --brace-style end-expand --replace \
		--end-with-newline \
		{} \;
