# NOTICEME

A NOTICE generator for npm packages.

This is modified slightly to better meet the needs of the Houdini Project

## Usage

```sh
# verifies that your NOTICE file is up to date
npx @houdiniproject/noticeme

# updates or creates your NOTICE file
npx @houdiniproject/noticeme -u
```

## Features

This uses the https://clearlydefined.io/ service and data to generate the
NOTICE.txt file from a package.json and an optional "included.json" file.

### included.json

It's common for open source developers to either vendor a package or copy in a portion of the package's code but
not add the originating package as a dependency. noticeme allows you to describe those packages using an `included.json`
file. The included.json file has the following format:

```json
//strictly speaking, the __explanation property is unneeded but it's helpful if you don't know what you're looking at.
{
    "__explanation": "packages where code was included from but isn't an NPM dependency. 'packages' is the list of packages",
    "packages": [
        {
            "name": "package1",
            "version": "0.6.3"
        },
        {
            "name": "package2",
            "version": "3.0.1"
        }
    ]
}
```

If you place the `included.json` file next to your `package.json` noticeme will automatically find it.

## DISCLAIMER

noticeme is helpful for creating NOTICE files but we make no warranty that it's accurate. It's your responsibility to comply with
any applicable licenses of the package your use.
