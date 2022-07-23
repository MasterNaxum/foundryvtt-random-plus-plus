class RandomPPModule 
{
	
	static ID = 'random-plus-plus';
	
	static MESSAGES = {
		INIT_START: { key: "init-start", ifnot: "%c > Random++ %c Initializing..."},
		INIT_FAILED_LW: { key: "init-failed-missing-lw", ifnot: "%c > Random++ %c Initialization failed: libWrapper module was not found on init hook."},
		INIT_SUCCESS: { key: "init-success", ifnot: "%c > Random++ %c Initialized!"},
		INIT_FAILED_LW_GM: { key: "init-failed-missing-lw-gm", ifnot: "The Random++ module requires the libWrapper module. Please install and activate it."},
		READY_SUCCESS: { key: "ready-success", ifnot: "%c > Random++ %c Ready!"},
		FIRE_INIT_HOOK: { key: "fire-init-hook", ifnot: "%c > Random++ %c Firing init hook." },
		FIRE_READY_HOOK: { key: "fire-ready-hook", ifnot: "%c > Random++ %c Firing ready hook." }
	}
	
	static SETTINGS = {
		METHOD: 'method',
		BULKSIZE: 'bulk-size'
	}

	static localize(key = "", ifnot = "")
	{
		const res = game.i18n.localize(key);
		return res === key ? ifnot : res;
	}
	
	static initialize() 
	{
		RandomPPModule.debug = false;
		
		RandomPPModule.lastResult = twist.int(); //Before it has been replaced by lib-wrapper.
		RandomPPModule.u32RandomArray = [];
		RandomPPModule.bulkSize = 8;
		
		var choices = {
			"original": `RANDOM-PLUS-PLUS.settings.${this.SETTINGS.METHOD}.OptionOriginal`,
			"reseed": `RANDOM-PLUS-PLUS.settings.${this.SETTINGS.METHOD}.OptionReseedAfter`,
			"reseed-before": `RANDOM-PLUS-PLUS.settings.${this.SETTINGS.METHOD}.OptionReseedBefore`,
			"js-math-random": `RANDOM-PLUS-PLUS.settings.${this.SETTINGS.METHOD}.JavascriptMathRandom`,
			"remote-anu-bulk": `RANDOM-PLUS-PLUS.settings.${this.SETTINGS.METHOD}.OptionRemoteANUBulk`
		};
		
		//Only enable remote-anu-single as an option if this is version 0.9.0 or higher.
		var versionRegexp = /[0]\.[0-8].[0-9]/;
		var versionString = game.version ? game.version : game.data.version;
		if((RandomPPModule.debug && !versionRegexp.test(versionString)))
		{
			choices["remote-anu-single"] = `RANDOM-PLUS-PLUS.settings.${this.SETTINGS.METHOD}.OptionRemoteANUSingle`;
		}
		
		//Register setting: Method
		game.settings.register(
			this.ID, 
			this.SETTINGS.METHOD, 
			{
				name: `RANDOM-PLUS-PLUS.settings.${this.SETTINGS.METHOD}.Name`,
				default: "original",
				type: String,
				scope: 'client',
				config: true,
				choices: choices,
				hint: `RANDOM-PLUS-PLUS.settings.${this.SETTINGS.METHOD}.Hint`,
				onChange: value => {
					RandomPPModule.SetRNGMethod(value);
				}
			}
		);
		
		//Register setting: Buffer/Bulk size
		game.settings.register(
			this.ID, 
			this.SETTINGS.BULKSIZE, 
			{
				name: `RANDOM-PLUS-PLUS.settings.${this.SETTINGS.BULKSIZE}.Name`,
				default: 32,
				type: Number,
				scope: 'client',
				config: true,
				range: {
					min: 8,
					max: 1024,
					step: 1
				},
				hint: `RANDOM-PLUS-PLUS.settings.${this.SETTINGS.BULKSIZE}.Hint`,
				onChange: value => {
					RandomPPModule.SetRNGBulk(value);
				}
			}
		);
		
		RandomPPModule.SetRNGMethod(game.settings.get(RandomPPModule.ID, RandomPPModule.SETTINGS.METHOD));
		RandomPPModule.bulkSize = game.settings.get(RandomPPModule.ID, RandomPPModule.SETTINGS.BULKSIZE);
	}
	
	static SetRNGMethod(method = "original") {
		switch(method){
			default:
			case "original":
				RandomPPModule.method = method;
			break;
			case "reseed":
				RandomPPModule.method = method;
			break;
			case "reseed-before":
				RandomPPModule.method = method;
			break;
			case "js-math-random":
				RandomPPModule.method = method;
			break;
			case "remote-anu-bulk":
				RandomPPModule.method = method;
				RandomPPModule.bulkSize = game.settings.get(RandomPPModule.ID, RandomPPModule.SETTINGS.BULKSIZE);
				RandomPPModule.RequestRemoteRNGResults();
			break;
			case "remote-anu-single":
				if(RandomPPModule.debug)
				{
					RandomPPModule.method = method;
					RandomPPModule.bulkSize = 1;
				}
				else
				{
					RandomPPModule.method = "original";
				}
			break;
		}
	}
	
	static SetRNGBulk(value = 32)
	{
		RandomPPModule.bulkSize = value;
	}
	
	static get CSS() { 
		return "color:#FFFFFF; background-image: linear-gradient(#0000DD, #000088); font-weight: bold; border: 0.1vh solid white; border-radius: 0.5vh; padding: 0.5vh; box-shadow: 0px 0px 1vh black;";
	}
	
	static RequestSingleRNG(){
		if(!!RandomPPModule.RemoteRequestInProgress) return;
		var remoteRequest = new XMLHttpRequest();
		remoteRequest.open("GET", "https://qrng.anu.edu.au/API/jsonI.php?length=1&type=hex16&size=4", false);
		remoteRequest.send(null);
		let response = JSON.parse(remoteRequest.response);
		return (remoteRequest.status === 200 && response.success) ? parseInt(response.data[0], 16) >>> 0 : undefined;
	}
	
	static RequestRemoteRNGResults(){
		if(!!RandomPPModule.RemoteRequestInProgress) return;
		RandomPPModule.RemoteRequestInProgress = true;
		try
		{
			var remoteRequest = new XMLHttpRequest();
			remoteRequest.open("GET", `https://qrng.anu.edu.au/API/jsonI.php?length=${RandomPPModule.bulkSize}&type=hex16&size=4`, true);
			remoteRequest.onload = function (e) {
				if (remoteRequest.readyState === 4) {
					if (remoteRequest.status === 200) {
						let response = JSON.parse(remoteRequest.response);
						if(!response.success)
						{
							RemoteRequestInProgress = false;
							return;
						}
						let toAdd = [];
						response.data.forEach( x => { toAdd.push(parseInt(x, 16) >>> 0); });
						RandomPPModule.u32RandomArray.push(...toAdd);
					} else {
						console.error(remoteRequest.statusText);
					}
				RandomPPModule.RemoteRequestInProgress = false;
				}
			};
			remoteRequest.onerror = function (e) {
				console.error(remoteRequest.statusText);
				RandomPPModule.RemoteRequestInProgress = false;
			};
			remoteRequest.send(null);
		}
		catch(exception)
		{
			RandomPPModule.RemoteRequestInProgress = false;
			console.error(exception.message);
		}
	}
	
	static bytes2int(x){
		var val = 0;
		for (var i = 0; i < x.length; ++i) {        
			val += x[i];        
			if (i < x.length-1) {
				val = val << 8;
			}
		}
		return val;
	}

	static double2byte(number){
		var buffer = new ArrayBuffer(8);         			// JS numbers are 8 bytes long, or 64 bits
		var longNum = new Float64Array(buffer);  			// so equivalent to Float64

		longNum[0] = number;

		return Array.from(new Int8Array(buffer)).reverse(); // reverse to get little endian
	}

}

Hooks.once('init', () => {
	console.log(RandomPPModule.localize(RandomPPModule.MESSAGES.INIT_START.key, RandomPPModule.MESSAGES.INIT_START.ifnot), RandomPPModule.CSS, "");
	if(!game.modules.get('lib-wrapper')?.active)
	{
		console.log(RandomPPModule.localize(RandomPPModule.MESSAGES.INIT_FAILED_LW.key, RandomPPModule.MESSAGES.INIT_FAILED_LW.ifnot), RandomPPModule.CSS, "");
		return;
	}
	RandomPPModule.initialize();
	console.log(RandomPPModule.localize(RandomPPModule.MESSAGES.INIT_SUCCESS.key, RandomPPModule.MESSAGES.INIT_SUCCESS.ifnot), RandomPPModule.CSS, "");
	Hooks.callAll('random-plus-plus.init');
	console.log(RandomPPModule.localize(RandomPPModule.MESSAGES.FIRE_INIT_HOOK.key, RandomPPModule.MESSAGES.FIRE_INIT_HOOK.ifnot), RandomPPModule.CSS, "");
});

Hooks.once('ready', () => {

	if(!game.modules.get('lib-wrapper')?.active)
	{
		if(game.user.isGM)
		{
			ui.notifications.error(RandomPPModule.localize(RandomPPModule.MESSAGES.INIT_FAILED_LW_GM.key, RandomPPModule.MESSAGES.INIT_FAILED_LW_GM.ifnot));
		}
		return;
	}

	game.modules.get('random-plus-plus').api = {
		SetRNGMethod: RandomPPModule.SetRNGMethod,
		RequestRemoteRNGResults: RandomPPModule.RequestRemoteRNGResults
	};
	
	libWrapper.register('random-plus-plus', 'MersenneTwister.prototype.int', function (wrapped, ...args) {
		switch(RandomPPModule.method)
		{
			default:
			case "original":
				RandomPPModule.lastResult = wrapped(...args);
				return RandomPPModule.lastResult;
			break;
			case "reseed":
				RandomPPModule.lastResult = wrapped(...args);
				this.seed(RandomPPModule.lastResult ^ (Date.now() & 0xFFFFFFFF));
				return RandomPPModule.lastResult;
			break;
			case "reseed-before":
				this.seed(RandomPPModule.lastResult ^ (Date.now() & 0xFFFFFFFF));
				RandomPPModule.lastResult = wrapped(...args);
				return RandomPPModule.lastResult;
			break;
			case "js-math-random":
				RandomPPModule.lastResult = ((Math.random() * 0xFFFFFFFF) >>> 0);
				return RandomPPModule.lastResult;
			break;
			case "remote-anu-single":
				const newResult = RandomPPModule.RequestSingleRNG();
				if(newResult === undefined)
				{
					//Fallback to the original method.
					RandomPPModule.lastResult = wrapped(...args);
					return RandomPPModule.lastResult;
				}
				return RandomPPModule.lastResult = newResult;
			break;
			case "remote-anu-bulk":
				if(RandomPPModule.u32RandomArray.length == 0)
				{
					//Attempt to Request more.
					RandomPPModule.RequestRemoteRNGResults();
					//Fallback to the original method.
					RandomPPModule.lastResult = wrapped(...args); 
					return RandomPPModule.lastResult;
				}
				RandomPPModule.lastResult = RandomPPModule.u32RandomArray.shift() >>> 0;
				if(RandomPPModule.u32RandomArray.length < RandomPPModule.bulkSize)
				{
					RandomPPModule.RequestRemoteRNGResults();
				}
				return RandomPPModule.lastResult;
			break;
		}
		
	}, libWrapper.MIXED);
	
	console.log(RandomPPModule.localize(RandomPPModule.MESSAGES.READY_SUCCESS.key, RandomPPModule.MESSAGES.READY_SUCCESS.ifnot), RandomPPModule.CSS, "");
	console.log(RandomPPModule.localize(RandomPPModule.MESSAGES.FIRE_READY_HOOK.key, RandomPPModule.MESSAGES.FIRE_READY_HOOK.ifnot), RandomPPModule.CSS, "");
	Hooks.callAll('random-plus-plus.ready');
});