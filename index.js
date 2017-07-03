var request = require('request');
var qs1 = require('qs');
var colors = require('colors');


var getOS = function() {
	var os = process.platform;
	if (os === 'darwin')
		return 'macos'
	return os;
}

var oss = getOS();

process.stdin.resume();
process.stdin.setEncoding('utf8');

var listDeps = function (pkg, deps) {
	for (var i in deps) {
		if ('dependencies' in deps[i]){
			pkg.push(i);
			pkg = listDeps (pkg, deps[i].dependencies);
		}
		else
			pkg.push(i);
	}
	return pkg;
}

var getLibs =  function(pkg) {
	var options = qs1.stringify(
		{ 
			packages: pkg, 
			os: oss, 
			pack_type: 'npm'
		}, {
        	arrayFormat : 'brackets'
    	}
    );

    var response = {};
	request({url:`http://localhost:3000/package?${options}`}, function (error , response, body) {
		if (! error && response.statusCode == 200) {
			response = body;
			startDialog(response);
		} else {
			console.log('\nSorry, the server maybe down\nPlease try again later\n\n'.red);
			console.log('Good Bye :)');
			process.exit();
		}
	});

}

var getDeps = function() {
	
	require('child_process').exec('npm ls --json', function(err, stdout, stderr) {
    	if (err) console.log(err.red);
    	else {
    		var deps = JSON.parse(stdout);
			var pkg = [];
			listDeps(pkg, deps.dependencies);
			getLibs(pkg);
    	}
	});
}

var startDialog = function (response) {
	console.log("\nI don't recognise the following npm packages:\n".yellow);
	console.log(JSON.parse(response).unrecognized + "\n");
	var res = JSON.parse(response)
	res.dependencies = [...new Set(res.dependencies)];

	loopDialog (res, 0);
}

var flag = true;
var temp = [];
var loopDialog = function (res, i) {
	if (!flag || temp.includes(res.unrecognized[i])) return;
	console.log(`Do you know the system libraries needed for: '${res.unrecognized[i]}' ?\n\n`.blue);
	console.log("To add dependencies enter them and press enter\n" + 
		"You can add multiple dependencies seperated by (,) e.g. dep1,dep2,....\n" + 
		"To pass to the next gem type n\n".yellow + 
		"To exit this section type 'e'\n".red);
	temp.push(res.unrecognized[i]);
	process.stdin.on('data', function(answer) {
		if (!flag) return;
		answer = answer.replace(/ /g, "").replace(/\n/g, "").split(",");
		if (answer.length === 0 || answer.length === 1 && answer[0].toLowerCase() === 'e'){
			flag = false;
			checkWhatToInstall(res.dependencies, 0);
		} else {
			if (answer.length === 1 && answer[0].toLowerCase() === 'n') {
				if ( i < res.unrecognized.length -1) {
					loopDialog (res, ++i);
				}
				else{
					flag = false;
					checkWhatToInstall(res.dependencies, 0);
				}
			} else {
				if (i < res.unrecognized.length){
				var x = {form: {packages: res.unrecognized[i], os: oss, pack_type: 'npm', dependencies: answer}};

				request.post('http://localhost:3000/add', {
					form: qs1.stringify({
						package: res.unrecognized[i], os: oss, pack_type: 'npm', dependencies: answer
					}, {
						arrayFormat : 'brackets'
					})}, 
					function (err, httpResponse, body) {
						if (err || httpResponse.statusCode !== 200) {
							console.log('\nSorry, the server maybe down\nPlease try again later\n\n'.red);
							console.log('Good Bye :)');
							process.exit();
						}
						else {
							console.log(answer.toString() + ' has been submitted successfully'.green);
							res.dependencies.concat(answer);
							if (i < res.unrecognized.length -1)
								loopDialog (res, ++i);
							else {
								flag = false;
								checkWhatToInstall (res.dependencies, 0);
							}
						}
				});
			}
			} 
		}
	});
}

var checkWhatToInstall = function (res, i) {
	if (res.length > 0)
		require('child_process').exec(`which ${res[i]}` , function(err, stdout, stderr) {
			if (err) {
				i++;
			} else {
				res.splice(i, 1);
	    	}
		   	if (i === res.length -1) {
		   		console.log("\nYour project needs the following system libraries:\n\n" + res.toString().green);
		   		if (oss === 'linux' || oss === 'darwin')
	   				installDialog (res);
		    }
		   	if (i < res.length -1) {
	   			checkWhatToInstall(res, i);
		   	}
		});
	else {
		console.log("\nNo system libraries needed (that I know of) are required.\n\n".green);
		console.log('Good Bye :)');
		process.exit();
	}
}

var installDialog = function (res) {
	process.stdin.resume();
	console.log ("\nWould like to install those system libraries? (y/n)".blue);
	process.stdin.on('data', function(answer) {
		answer = answer.replace(/\n/g, "");
		if (answer.toLowerCase() === 'y' || answer.toLowerCase === 'yes'){
			beginInstall (res, 0);
		} else {
			console.log("Good Bye :)");
			process.exit();
		}
	});
}

var beginInstall = function (res, i) {
	var installed = [];
	eval (`${oss}Install(res, i, installed)`);
}

var linuxInstall = function(res, i, installed) {
	require('child_process').exec(`sudo apt-get install ${res[i]}` , function(err, stdout, stderr) {
			if (err) {
				i++;
			} else {
				installed.push(res[i]);
				res.splice(i, 1);
	    	}
		   	if (i === res.length -1) {
		   		console.log('\nThe following system libraries were installed successfully:\n'.green);
		   		console.log(installed.toString());
		   		console.log("\nThe follwoing system libraries couldn't be installed:\n".red);
		   		console.log(res.toString());
		   		console.log('Good Bye :)');
	   			process.exit();
		    }
		   	if (i < res.length -1) {
	   			linuxInstall(res, i, installed);
		   	}
		});
}

var darwinInstall = function(res, i) {
	require('child_process').exec(`bower install ${res[i]} --no-interactive`, function(err, stdout, stderr) {
			if (err) {
				i++;
			} else {
				installed.push(res[i]);
				res.splice(i, 1);
	    	}
		   	if (i === res.length -1) {
		   		console.log('\nThe following system libraries were installed successfully:\n'.green);
		   		console.log(installed.toString());
		   		console.log("\nThe follwoing system libraries couldn't be installed:\n".red);
		   		console.log(res.toString());
		   		console.log('Good Bye :)');
	   			process.exit();
		    }
		   	if (i < res.length -1) {
	   			linuxInstall(res, i, installed);
		   	}
		});
}

exports.main = function() {
	getDeps();
}

//main();