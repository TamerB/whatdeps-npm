# whatdeps-npm

This is an npm package that collects the project dependencies and operating system information, and displays the required system libraries to
install all your dependencies.

## Installation

In your terminal type


    $ npm install whatdeps



## Usage

To start searching for your dependencies system requirements, execute:

```javascript
var whatdeps = require('whatdeps');
whatdeps.main();
```

and follow the dialog.

Note: You can connect this npm package to an other REST API clone from https://github.com/TamerB/GemService . Just replace the base uri in lines 42 and 106 with your uri
 . For example:

```javascript
...
request({url:`http://localhost:3000/package?${options}`}, function (error , response, body) {...}
...
request.post('http://localhost:3000/add', {form:{...}}, function (err, httpResponse, body) {...}
...
```  

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/TamerB/whatdeps-npm. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](http://contributor-covenant.org) code of conduct.

## License

The gem is available as open source under the terms of the [ISC License](https://opensource.org/licenses/ISC).