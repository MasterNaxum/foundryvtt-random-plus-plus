class RandomPPModule {
  
	static ID = 'random-plus-plus';
	
	static FLAGS = {
		
	}
	
	static TEMPLATES = {
		
	}
	
	static SETTINGS = {
		METHOD: 'method',
	}
	
	static initialize() 
	{
		//console.log("RandomPPModule::initialize");
		game.settings.register(
			this.ID, 
			this.SETTINGS.METHOD, 
			{
				name: `RANDOM-PLUS-PLUS.settings.${this.SETTINGS.METHOD}.Name`,
				default: "original",
				type: String,
				scope: 'client',
				config: true,
				choices: {
					"original": `RANDOM-PLUS-PLUS.settings.${this.SETTINGS.METHOD}.OptionOriginal`,
					"reseed": `RANDOM-PLUS-PLUS.settings.${this.SETTINGS.METHOD}.OptionReseed`
			    },
				hint: `RANDOM-PLUS-PLUS.settings.${this.SETTINGS.METHOD}.Hint`,
				onChange: value => {  
					this.useNewMethod = value === "reseed";
				}
			}
		);
		
		this.useNewMethod = game.settings.get(RandomPPModule.ID, RandomPPModule.SETTINGS.METHOD) === "reseed";
	}
	
	static SetRNGMethod(useNewMethod = false) {
		this.useNewMethod = useNewMethod;
	}
	
	static NewSeed() {
		if(twist)
		{
			twist.seed(twist.int() ^ (Date.now() & 4294967295) );
		}
	}
	
	static CSS() { 
		return "color:#FFFFFF; background-image: linear-gradient(#0000DD, #000088); font-weight: bold; border: 0.1vh solid white; border-radius: 0.5vh; padding: 0.5vh; box-shadow: 0px 0px 1vh black;";
	}
}

Hooks.once('init', () => {
    console.log("%c > Random++ %c Init hook called.", RandomPPModule.CSS(), "");
	RandomPPModule.initialize();
});

Hooks.once('ready', () => {
    console.log("%c > Random++ %c Ready hook called.", RandomPPModule.CSS(), "");
	
	if(!game.modules.get('lib-wrapper')?.active && game.user.isGM)
	{
        ui.notifications.error("The module [ Random++ ] requires the 'libWrapper' module. Please install and activate it.");
		return;
	}
	
	game.modules.get('random-plus-plus').api = {
		SetRNGMethod: RandomPPModule.SetRNGMethod,
		NewSeed: RandomPPModule.NewSeed
	};
	
	libWrapper.register('random-plus-plus', 'MersenneTwister.prototype.int', function (wrapped, ...args) {
		let result = wrapped(...args);
		if(!RandomPPModule.useNewMethod) this.seed(result ^ (Date.now() & 4294967295))
		return result;
	}, 'WRAPPER');
});
