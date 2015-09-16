/*!
 *
 * Ascendency Ship Analyzer
 *
 * Analyze ship builds in the game Ascendency.
 *
 */

;(function (window, undefined) {

	'use strict';

	//
	// Global
	//

	var kCOMP = {
			NONE : {className : 'none',    name : 'Component'},
			WEAP : {className : 'weapon',  name : 'Weapon'},
			SHLD : {className : 'shield',  name : 'Shield'},
			ENGN : {className : 'engine',  name : 'Engine'},
			SCAN : {className : 'scanner', name : 'Scanner'},
			GNTR : {className : 'power',   name : 'Generator'},
			SPEC : {className : 'special', name : 'Special Component'}
		},
		COMP_ATTR_FLAGS = [
			{index : 0, value : 1<<0, name : 'GZ_TARGETSHIP'    , desc : 'This device can target enemy ships.'},
			{index : 1, value : 1<<1, name : 'GZ_TARGETLANE'    , desc : 'This device can target star lanes.'},
			{index : 2, value : 1<<2, name : 'GZ_TARGETORBIT'   , desc : 'This device can target orbital structures.'},
			{index : 3, value : 1<<3, name : 'GZ_TARGETSURFACE' , desc : 'This device can target surface structures.'},
			{index : 4, value : 1<<4, name : 'GZ_TARGETOWNSHIPS', desc : 'This device can target your own ships.'},
			{index : 5, value : 1<<5, name : 'GZ_TOGGLEABLE'    , desc : 'This device can be toggled on or off.'},
			{index : 6, value : 1<<6, name : 'GZ_NOTARGET'      , desc : 'This device cannot target.'},
			{index : 7, value : 1<<7, name : 'GZ_PASSIVE'       , desc : 'This device is always on.'}
		],
		hulls,
		components,
		noDevice,
		weapons,
		shields,
		engines,
		scanners,
		generators,
		specials;

	//
	// Ship Plan
	//

	function ShipPlan (hull, componentArr) {
		this.hull      = hulls[0];
		this.equipment = [];
		if (hull !== undefined) {this.setHull(hull);}
		this.equipComponentArr(componentArr);
	}

	ShipPlan.prototype.equipComponent    = function (i, component) {
		if (!window.isNaN(component)) {component = components[component];}
		if (isComponent(component)) {
			if (!window.isNaN(i) && i >= 0 && i < this.hull.slots) {
				this.equipment[i] = component;
			}
			else {
				window.console.log('AscendCalc: Error: Ship component slot out of range.');
			}
		}
		else {
			window.console.log('AscendCalc: Error: Invalid ship component.');
		}
	};
	ShipPlan.prototype.equipComponentArr = function (componentArr) {
		var i   = 0,
			ii  = (componentArr)? componentArr.length || 0 : 0,
			iii = this.hull.slots;
		for (; i < iii; i++) {
			if (i < ii && isComponent(componentArr[i])) {
				this.equipComponent(i, componentArr[i]);
			}
			else {
				this.equipComponent(i, noDevice);
			}
		}
	};
	ShipPlan.prototype.setHull           = function (hull) {
		if (!window.isNaN(hull)) {hull = hulls[hull];}
		if (hulls.indexOf(hull) >= 0) {
			this.hull = hull;
			this.equipment.length = this.hull.slots;
			this.equipComponentArr(this.equipment);
		}
		else {window.console.log('AscendCalc: Error: Invalid hull.');}
	};

	ShipPlan.prototype.getLevel          = function (type) {
		var result = 0;
		for (var i = 0, ii = this.equipment.length; i < ii; i++) {
			if (this.equipment[i].type === type) {
				result += this.equipment[i].getRating();
			}
		}
		return result;
	};
	ShipPlan.prototype.getPowerUsage     = function (type) {
		var result = 0;
		if (type !== kCOMP.GNTR && type !== undefined) {
			for (var i = 0, ii = this.equipment.length; i < ii; i++) {
				if (this.equipment[i].type === type) {
					result += this.equipment[i].power;
				}
			}
		}
		return result;
	};

	ShipPlan.prototype.getMaxAttack           = function () {
		var result = 0;
		for (var i = 0, ii = this.equipment.length; i < ii; i++) {
			if (this.equipment[i].type === kCOMP.WEAP) {
				result += this.equipment[i].getMaxAttack();
			}
		}
		return result;
	};
	ShipPlan.prototype.getWeaponMaxPowerUsage = function () {
		var result = 0;
		for (var i = 0, ii = this.equipment.length; i < ii; i++) {
			if (this.equipment[i].type === kCOMP.WEAP) {
				result += this.equipment[i].getMaxPower();
			}
		}
		return result;
	};
	ShipPlan.prototype.getShieldDuration   = function () {
		return Math.floor((this.getLevel(kCOMP.GNTR) / this.getPowerUsage(kCOMP.SHLD)) || 0);
	};
	ShipPlan.prototype.getMaxMovement      = function () {
		return (
			this.getLevel(kCOMP.ENGN) *
			this.getLevel(kCOMP.GNTR) /
			this.getPowerUsage(kCOMP.ENGN)
		) || 0;
	};
	ShipPlan.prototype.getScannerRange     = function () {
		var result = 0;
		for (var i = 0, ii = this.equipment.length; i < ii; i++) {
			if (this.equipment[i].type === kCOMP.SCAN) {
				result += this.equipment[i].range;
			}
		}
		return result;
	};
	ShipPlan.prototype.getWeaponEfficiency = function () {
		return (this.getMaxAttack() / this.getWeaponMaxPowerUsage()) || 0;
	};
	ShipPlan.prototype.getShieldEfficiency = function () {
		return (this.getLevel(kCOMP.SHLD) / this.getPowerUsage(kCOMP.SHLD)) || 0;
	};
	ShipPlan.prototype.getEngineEfficiency = function () {
		return (this.getLevel(kCOMP.ENGN) / this.getPowerUsage(kCOMP.ENGN)) || 0;
	};

	ShipPlan.prototype.getSpecialPowerUsageDetail = function () {
		var result = {},
			k = 0,
			power;
		for (var i = 0, ii = this.equipment.length; i < ii; i++) {
			if (this.equipment[i].type === kCOMP.SPEC) {
				k = this.equipment[i].getIndex();
				power = this.equipment[i].power;
				if (result.hasOwnProperty(k)) {
					result[k].count++;
					result[k].power += power;
				}
				else if (power) {
					result[k] = {count : 1, power : power};
				}
			}
		}
		return result;
	};
	ShipPlan.prototype.getReplenisherCount        = function () {
		var result = 0;
		for (var i = 0, ii = this.equipment.length; i < ii; i++) {
			if (this.equipment[i].getIndex() === 66) {result++;}
		}
		return result;
	};

	ShipPlan.prototype.getIndustryCost     = function () {
		var result = this.hull.cost;
		for (var i = 0, ii = this.equipment.length; i < ii; i++) {
			result += this.equipment[i].cost;
		}
		return result;
	};

	function createShipPlan (hull, componentArr) {
		return new ShipPlan(hull, componentArr);
	}

	//
	// Ship Components
	//

	function isComponent (component) {return components.indexOf(component) >= 0;}

	//
	// Init
	//

	;(function initComponents () {

		//
		// Ship Component Classes
		//

		function Hull (name, slots, health, cost) {
			this.name   = name;
			this.slots  = slots;
			this.health = health;
			this.cost   = cost;
		}

		function Component (name, power, range, level, uses, cost, flags, desc) {
			this.name  = name;
			this.power = power;
			this.range = range;
			this.level = level;
			this.uses  = uses;
			this.cost  = cost;
			this.flags = flags;
			this.desc  = desc;
		}
		Component.prototype.getIndex     = function () {return components.indexOf(this);};
		Component.prototype.getRating    = function () {return this.level;};
		Component.prototype.getAttrFlags = function () {
			var result = [];
			for (var i = 0, ii = COMP_ATTR_FLAGS.length; i < ii; i++) {
				if ((this.flags & 1<<i) === 1<<i) {
					result.push(COMP_ATTR_FLAGS[i]);
				}
			}
			return result;
		};

		function NoDevice () {Component.apply(this, arguments);}
		NoDevice.prototype            = window.Object.create(Component.prototype);
		NoDevice.prototype.type       = kCOMP.NONE;

		function Weapon () {Component.apply(this, arguments);}
		Weapon.prototype              = window.Object.create(Component.prototype);
		Weapon.prototype.type         = kCOMP.WEAP;
		Weapon.prototype.getMaxAttack = function () {return this.uses * this.level;};
		Weapon.prototype.getMaxPower  = function () {return this.uses * this.power;};

		function Shield () {Component.apply(this, arguments);}
		Shield.prototype                = window.Object.create(Component.prototype);
		Shield.prototype.type           = kCOMP.SHLD;
		Shield.prototype.getShieldLevel = function () {
			return window.Math.ceil(this.level * 3 / 10);
		};
		Shield.prototype.getRating      = Shield.prototype.getShieldLevel;

		function Engine () {Component.apply(this, arguments);}
		Engine.prototype               = window.Object.create(Component.prototype);
		Engine.prototype.type          = kCOMP.ENGN;

		function Scanner () {
			Component.apply(this, arguments);
			this.rating = this.level;
			this.level  = 3;
		}
		Scanner.prototype               = window.Object.create(Component.prototype);
		Scanner.prototype.type          = kCOMP.SCAN;
		Scanner.prototype.getRating     = function () {return this.rating;};

		function Generator () {Component.apply(this, arguments);}
		Generator.prototype           = window.Object.create(Component.prototype);
		Generator.prototype.type      = kCOMP.GNTR;
		Generator.prototype.getRating = function () {return this.power;};

		function Special () {Component.apply(this, arguments);}
		Special.prototype             = window.Object.create(Component.prototype);
		Special.prototype.type        = kCOMP.SPEC;

		//
		// Ship Component Data
		//

		hulls = [];
		hulls.push(new Hull('Small'   ,  5, 10,  70));
		hulls.push(new Hull('Medium'  , 10, 20, 170));
		hulls.push(new Hull('Large'   , 15, 30, 240));
		hulls.push(new Hull('Enormous', 25, 40, 410));

		noDevice = new NoDevice('None', 0, 0, 0, 0, 0, 0, 'No component equipped.');

		weapons = [];
		weapons.push(new Weapon('Mass Barrage Gun'            ,  1,   25,  1, 1,  10, 1<<0|1<<2          , 'The Mass Barrage Gun launches a spray of projectiles from its electromagnetic accelerators. It is cheap to build and uses little power. The projectiles are low-tech spheres of solid metal that rely on kinetic energy to do damage. It is easy to deflect, slow to reload, and has a short range.'));
		weapons.push(new Weapon('Fourier Missiles'            ,  1,   40,  2, 1,  20, 1<<0|1<<2          , 'Fourier Missiles use image recognition to identify vulnerable areas of a ship. They require little power to fire, but they reload slowly and don\'t do much damage.'));
		weapons.push(new Weapon('Quantum Singularity Launcher',  2,   25,  4, 1,  30, 1<<0|1<<1|1<<2     , 'The Quantum Singularity Launcher generates and fires tiny black holes, infinitely small but incredibly massive objects that easily punch through an Ion Wrap field. The disadvantages of this weapon are its short range and long recharge time.'));
		weapons.push(new Weapon('Molecular Disassociator'     ,  2,   50,  4, 1,  40, 1<<0|1<<1|1<<2     , 'The Molecular Disassociator generates a cloud that weakens the molecular bonds in matter. This tends to corrode the target rapidly. Its main drawback is that it takes a long time to form a fully charged cloud.'));
		weapons.push(new Weapon('Electromagnetic Pulser'      ,  1,   50,  1, 5,  50, 1<<0|1<<1|1<<2     , 'The Electromagnetic Pulser produces electromagnetic pulses that disrupt delicate technological equipment. It does little structural damage but it strobes very quickly, producing many pulses in a short time that can overload and destroy the target ship.'));
		weapons.push(new Weapon('Plasmatron'                  ,  2,  100,  4, 1,  50, 1<<0|1<<1|1<<2|1<<3, 'The Plasmatron fires extremely long range bolts of super-heated plasma. It takes a long time to recharge.'));
		weapons.push(new Weapon('Ueberlaser'                  ,  3,   50,  6, 2,  70, 1<<0|1<<1|1<<2|1<<3, 'The Ueberlaser is a high-power pulse laser that cuts instantly through an unshielded ship hull. It uses a lot of power but does heavy damage.'));
		weapons.push(new Weapon('Fergnatz Lens'               ,  0,   35,  4, 2,  50, 1<<0|1<<1|1<<2|1<<3, 'The Fergnatz Lens passively collects and focuses cosmic energies at its target. It requires no power to operate.'));
		weapons.push(new Weapon('Hypersphere Driver'          ,  6,   75, 10, 2, 100, 1<<0|1<<1|1<<2|1<<3, 'The Hypersphere Driver creates unstable bubbles in spacetime that extend into higher dimensions. When these bubbles intersect normal matter they collapse, pinching off the matter inside another dimension. They have a very long range and inflict massive damage. This weapon is extremely expensive to produce and gobbles power.'));
		weapons.push(new Weapon('Nanomanipulator'             ,  6,   50, 13, 3, 100, 1<<0|1<<1|1<<2|1<<3, 'The Nanomanipulator fires bursts of highly focused nanoenergon flux. The flux induces a chaotic nanowave upon impact that rips through the target, destructively jumbling alternate realities together. It is hugely destructive, fires in quick bursts, and uses a lot of power.'));

		shields = [];
		shields.push(new Shield('Ion Wrap'                    ,  1,    0,  1, 0,  10, 1<<5, 'The Ion Wrap is a low-grade particle defense shield. Like most shields, it only consumes power when it is active.'));
		shields.push(new Shield('Concussion Shield'           ,  2,    0,  4, 0,  30, 1<<5, 'The Concussion Shield surrounds a ship with a flexible energy barrier that absorbs kinetic impulses and spreads them over its entire surface. Like most shields, it only consumes power when it is active.'));
		shields.push(new Shield('Wave Scatterer'              ,  0,    0,  2, 0,  50, 1<<5, 'The Wave Scatterer is an energy dispersion mechanism that passively diffracts and scatters energy waves as they make contact with a ship\'s hull. The Wave Scatterer is a weak defense, but unlike most shields it consumes no power.'));
		shields.push(new Shield('Deactotron'                  ,  3,    0, 10, 0,  50, 1<<5, 'The Deactotron is a high-tech active defense module. When it detects the approach of particle or energy projectiles, it reacts by ejecting an appropriate countermeasure. Like most shields, it only consumes power when it is active.'));
		shields.push(new Shield('Hyperwave Nullifier'         ,  6,    0, 13, 0, 100, 1<<5, 'The Hyperwave Nullifier surrounds a ship with a space-distorting hyperwave field. The field causes incoming projectiles to slide around the hull of their target and miss it completely. Like most shields, the Hyperwave Nullifier only consumes power when it is active.'));
		shields.push(new Shield('Nanoshell'                   ,  3,    0, 15, 0, 200, 1<<5, 'The Nanoshell simply creates a dense barrier of Nanoenergons around a ship. Few weapons are able to penetrate it. Like most shields, it only consumes power when it is active.'));

		engines = [];
		engines.push(new Engine('Tonklin Motor'               ,  1,    0,  2, 0,  10, 1<<7, 'The Tonklin Motor is a weak engine based on an elegant quirk of momentum theory. It is very inexpensive to construct.'));
		engines.push(new Engine('Ion Banger'                  ,  1,    0,  4, 0,  30, 1<<7, 'The Ion Banger sucks in ions from surrounding space and smashes them into each other at high speeds, creating a propulsive force. It is significantly more powerful than the Tonklin Motor.'));
		engines.push(new Engine('Graviton Projector'          ,  3,    0,  6, 0,  40, 1<<7, 'The Graviton Projector sprays a gravity field in front of a ship, pulling it perpetually forward. The Graviton Projector is more powerful than the Ion Banger.'));
		engines.push(new Engine('Inertia Negator'             ,  1,    0,  6, 0,  20, 1<<7, 'The Inertia Negator generates an anti-mass field that allows a ship to float lightly through space. It is about as strong as the Graviton Projector, but it consumes much less power.'));
		engines.push(new Engine('Nanowave Space Bender'       ,  5,    0, 10, 0,  80, 1<<7, 'The Nanowave Space Bender projects a wide-band field of nanoenergy that warps the space around a ship, allowing it to slide rapidly in any direction. It is a very powerful engine.'));

		scanners = [];
		scanners.push(new Scanner('Tonklin Frequency Analyzer',  0,   25,  1, 0,  20, 1<<7, 'The Tonklin Frequency Analyzer scans energy leakages from a ship to determine information about its status. Its range is relatively short. It is always active and consumes no power.'));
		scanners.push(new Scanner('Subspace Phase Array'      ,  0,   50,  1, 0,  40, 1<<7, 'The Subspace Phase Array detects subtle variations in the space flow around a ship. It is able to detect a ship\'s status information at short to medium range. It is always active and consumes no power.'));
		scanners.push(new Scanner('Aural Cloud Constructor'   ,  0,   75,  2, 0,  60, 1<<7, 'The Aural Cloud Constructor is a medium range scanner that projects an aural cloud through surrounding space, observing vibrations in the cloud to detect the status of other ships. It is always active and consumes no power.'));
		scanners.push(new Scanner('Hyperwave Tympanum'        ,  0,  100,  3, 0,  80, 1<<7, 'The Hyperwave Tympanum is a long range scanner that is able to detect the minutest variations in the hyperwave ether and analyze them to obtain status information about other ships. It is always active and consumes no power.'));
		scanners.push(new Scanner('Murgatroyd\'s Knower'      ,  0,  200,  4, 0, 100, 1<<7, 'Murgatroyd\'s Knower is a very long range scanner that uses a combination of advanced technologies to determine the status of other ships. It is always active and consumes no power.'));
		scanners.push(new Scanner('Nanowave Decoupling Net'   ,  0, 1000,  5, 0, 200, 1<<7, 'The Nanowave Decoupling Net harvests coupled nanowaves from surrounding space and analyzes them to learn the status of other ships. Its range is practically unlimited. It is always active and consumes no power.'));

		generators = [];
		generators.push(new Generator('Proton Shaver'         ,  2,    0,  1, 0,  20, 1<<7, 'The Proton Shaver is a power generator that operates by extracting small quantities of protons from heavy atomic nuclei and converting them to energy. It is inexpensive but produces little power.'));
		generators.push(new Generator('Subatomic Scoop'       ,  4,    0,  2, 0,  35, 1<<7, 'The Subatomic Scoop sucks subatomic particles from surrounding space and converts them to energy. It is a stronger generator than the Proton Shaver.'));
		generators.push(new Generator('Quark Express'         ,  6,    0,  3, 0,  60, 1<<7, 'The Quark Express uses a little-understood technology to squeeze energy from various sub-subatomic particles. It is a powerful generator.'));
		generators.push(new Generator('Van Creeg Hypersplicer',  8,    0,  4, 0,  80, 1<<7, 'The Van Creeg Hypersplicer merges mixed-frequency hyperwaves and collects the energy bleed-off. It is a very powerful generator.'));
		generators.push(new Generator('Nanotwirler'           , 10,    0,  5, 0, 100, 1<<7, 'The Nanotwirler puts a stream of Nanoenergons into sympathetic resonant motion, and channels off the energy they release from each other. It generates even more power than the Van Creeg Hypersplicer.'));

		specials = [];
		specials.push(new Special('Lane Blocker'              ,  3,   40,  0, 1,  30, 0   , 'The Lane Blocker is fired into a star lane opening where it sits, elevating the inherent gravitational turbulence of the opening to the point where Star Lane Drives and Star Lane Hyperdrives can no longer overcome it.'));
		specials.push(new Special('Molecular Tie Down'        ,  7,   25,  0, 1,  20, 0   , 'When fired at a ship, the Molecular Tie Down temporarily immobilizes it by damping the reactions powering its engines. This affects all known normal engines, even the powerful Nanowave Space Bender.'));
		specials.push(new Special('Intellect Scrambler'       ,  7,   25,  0, 1,  20, 0   , 'When fired at a ship, the Intellect Scrambler partially wipes the minds of that ship\'s crew, eradicating their skills and memory of the recent past. It can turn an experienced crew into a group of bumbling rookies.'));
		specials.push(new Special('Brunswik Dissipator'       , 15,   25,  0, 1, 100, 0   , 'When the Brunswik Dissipator is fired at a ship, it temporarily drains the target ship\'s generators, leaving it powerless. It is costly to construct and power hungry.'));
		specials.push(new Special('Recaller'                  ,  7,    0,  0, 0,  40, 1<<6, 'The Recaller creates an unstable shunt through star lane space to a ship\'s home system. The ship using the Recaller moves instantly into the shunt and arrives immediately at its home system.'));
		specials.push(new Special('Disarmer'                  ,  5,   40,  0, 1,  30, 0   , 'The Disarmer was first designed as a weapon of peace. It selectively destroys weapons without causing other damage. It uses visual pattern recognition and analysis of energy output to identify a weapon on the target ship, then it causes that weapon to overload and destroy itself.'));
		specials.push(new Special('Smart Bomb'                ,  7,    0,  7, 0,  30, 1<<6, 'The Smart Bomb uses advanced empathic biosensor technology to determine the relationships between the ship using it and the other ships present in the star system. Once activated, it fires in multiple directions at every ship it has determined to be hostile, doing heavy damage comparable to that of an Ueberlaser. One use expends it.'));
		specials.push(new Special('Gravity Distorter'         ,  4,    0,  0, 1,  20, 1<<6, 'The Gravity Distorter creates a gravitational wave front that emanates from the ship using the device. This pushes small objects, such as space vessels, away from the ship that used the Distorter.'));
		specials.push(new Special('Fleet Disperser'           ,  5,  100,  0, 1,  30, 0   , 'The Fleet Disperser is fired at another ship. Its effect is similar to that of the Gravity Distorter in that it creates a gravitational ripple that repels other ships away from its target. It has an extremely long range.'));
		specials.push(new Special('X Ray Megaglasses'         ,  0,   50,  0, 0, 100, 1<<5, 'The X Ray Megaglasses allow you to view the contents of any ship you are able to scan. They require no power to maintain but are fairly expensive to build. Used in conjunction with powerful scanners, they can be very informative.'));
		specials.push(new Special('Cloaker'                   ,  0,    0,  0, 0,  30, 1<<7, 'The vibrating crystals of the Cloaker produce a broad spectrum of noise and interference that blocks all sensors from gathering information about the cloaked ship. The device requires no power and is always in effect once it is added to a ship.'));
		specials.push(new Special('Star Lane Drive'           ,  0,    0,  1, 0,  25, 1<<7, 'The Star Lane Drive is the key to interstellar exploration. This device is activated by the energies emanating from the opening to a star lane, and requires no power to operate. It allows the ship to overcome the barrier of gravitational turbulence at the opening and slip into star lane space. The more Star Lane Drives a ship contains, the faster it will slide through star lane space.'));
		specials.push(new Special('Star Lane Hyperdrive'      ,  0,    0,  2, 0,  50, 1<<7, 'The Star Lane Hyperdrive is a more powerful version of the Star Lane Drive that improves speed through star lane space. Although regular Star Lane Drives allow slow travel through red links, the Hyperdrive makes the use of red links practical. Star Lane Hyperdrives are much more costly to produce than Star Lane Drives.'));
		specials.push(new Special('Positron Bouncer'          ,  2,   60,  0, 1,  10, 0   , 'The accelerators inside the Positron Bouncer produce a high-momentum blob of particles. When fired at a ship, the particles impart their momentum to the ship, buffeting it away without damaging it. The Positron Bouncer consumes little power and is cheap to build.'));
		specials.push(new Special('Gravimetric Catapult'      ,  3,    0,  0, 1,  15, 1<<6, 'The Gravimetric Catapult causes the ship using it to experience temporarily exaggerated gravitational force. The ship is pulled toward the strongest gravity well in the vicinity, the nearest sun. The ship whips past the sun, stopping opposite its previous position when it has run out of momentum.'));
		specials.push(new Special('Myrmidonic Carbonizer'     ,  4,   40, 20, 1,  70, 0   , 'The Myrmidonic Carbonizer fires a burst of energy that grows in strength for a while then dissipates. There is an ideal range for the Carbonizer, at which it is the most powerful weapon known. It is a complex and expensive piece of machinery.'));
		specials.push(new Special('Containment Device'        ,  5,   40,  0, 1,  15, 0   , 'The Containment Device destroys one colonizer or invasion module, just as the Disarmer destroys one weapon. It is intended to be a peaceful weapon, used to protect planets from invasion. Like the Disarmer, it only causes harm to machinery.'));
		specials.push(new Special('Shield Blaster'            ,  7,   25,  0, 1,  30, 0   , 'The Shield Blaster temporarily shuts down the defensive systems of the target ship, leaving it vulnerable to attack.'));
		specials.push(new Special('Backfirer'                 , 10,   25,  0, 1,  60, 0   , 'The Backfirer causes all the weapons aboard the target ship to simultaneously unleash their destructive potential--unaimed, uncontrolled, and chaotically. The more weapons the target ship carries, the more it is damaged by its own weapons.'));
		specials.push(new Special('Lane Destabilizer'         ,  7,   25,  0, 1,  40, 0   , 'When fired at a star lane or red link opening, the Lane Destabilizer induces gravity waves at the resonant frequency of the star lane. This causes the ships inside the star lane to be thrown quickly toward their destination point. The Lane Destabilizer itself is destroyed in the process.'));
		specials.push(new Special('Tractor Beam'              ,  3,  100,  0, 1,  30, 1<<0, 'The Tractor Beam allows a ship to pull another ship toward it. It has a very long range and uses little power.'));
		specials.push(new Special('Cannibalizer'              ,  0,    0,  0, 1,  20, 1<<6, 'The Cannibalizer is an emergency device that allows a ship to convert some of the mass of its own hull into an energy reserve. This is destructive to the ship, so it is usually used only in a last ditch effort to survive.'));
		specials.push(new Special('Moving Part Exploiter'     , 10,   25,  0, 1,  60, 0   , 'Through a combination of ultrasonic vibration, spacetime micro-distortion, and luck destabilization magitechnology, the Moving Part Exploiter causes devices to break down explosively. The more intricate and advanced the equipment on the target ship, the more internal damage it suffers from equipment malfunction. This device is costly to build and consumes a lot of power.'));
		specials.push(new Special('Hyperswapper'              ,  3,  100,  0, 1,  20, 0   , 'The Hyperswapper creates a standing hyperwave field between a ship and its target, producing a massive space disturbance that causes them to swap positions. It operates at an extremely long range, uses little power, and is cheap to produce.'));
		specials.push(new Special('Gravimetric Condensor'     ,  5,    0,  0, 1,  30, 1<<6, 'The Gravimetric Condensor momentarily increases the gravitational field strength of a star, causing all the ships in the system to be pulled toward the star with great force.'));
		specials.push(new Special('Accutron'                  ,  7,    0,  0, 1,  60, 0   , 'The Accutron is a massive space analysis and targeting system that increases the effective range of all the weapons on a ship. It is fairly costly to build, but can provide a strong advantage in battle.'));
		specials.push(new Special('Remote Repair Facility'    , 10,    0,  0, 0,  70, 1<<6, 'The Remote Repair Facility allows a ship to repair damage without having to enter Orbital Docks. It consists of automated systems spreading throughout the ship, engineered so finely that the repair process resembles organic healing. It uses a lot of power when activated, and adding it to a ship is an expensive project.'));
		specials.push(new Special('Sacrificial Orb'           ,  3,   50,  0, 0,  20, 0   , 'The Sacrificial Orb is a magitechnological device that allows a ship to repair damage to another ship by absorbing that damage itself. It should be used with caution, some inattentive captains have managed to scuttle their own flagships with it!'));
		specials.push(new Special('Lane Magnetron'            , 10,   25,  0, 1,  50, 0   , 'The Lane Magnetron frees the ship using it from the gravitational turbulence-induced drag normally encountered in star lane space, allowing the ship to slip through the star lane almost instantly. The Lane Magnetron uses fully as much power as a Nanotwirler produces and can be used only once.'));
		specials.push(new Special('Disintegrator'             , 25,   25,  0, 1, 150, 1<<0, 'The Disintegrator ejects a cloud of infinitesimal bubbles of alternate reality that cause a chain reaction in the target ship, spreading it atom by atom across infinite alternate timelines. The cloud has no substance and cannot be blocked by normal defenses. The Disintegrator can be used only once, is extremely expensive to build, and uses an immense amount of power. It must be used at close range.'));
		specials.push(new Special('Lane Endoscope'            , 10,   25,  0, 0,  20, 0   , 'The Lane Endoscope allows astronomical instruments to penetrate star lane space and scan the system at the other end of a star lane or red link opening. It requires a lot of power to use.'));
		specials.push(new Special('Toroidal Blaster'          ,  0,    0,  0, 1,  20, 0   , 'The Toroidal Blaster gives the ship using it a huge boost in engine performance, but it is hard on the engines and usually damages some of them. It draws all the power it needs from the engines and needs no generator power.'));
		specials.push(new Special('Gizmogrifier'              ,  4,   40,  0, 1,  30, 0   , 'Like the Disarmer, the Specialty Blaster, and the Containment Device, the Gizmogrifier is specialized to damage equipment without inflicting any other harm. It performs a general purpose version of this concept, and it will destroy the first major device it locks onto.'));
		specials.push(new Special('Replenisher'               ,  8,    0,  0, 1,  60, 1<<6, 'The Replenisher fully recharges all of the weapons aboard a ship. Its installation is involved and expensive, but it can be a lifesaver in an intense battle.'));
		specials.push(new Special('Specialty Blaster'         ,  5,   40,  0, 1,  30, 0   , 'The Specialty Blaster destroys one specialized device, just as the Disarmer destroys one weapon. Like the Disarmer, it recognizes a particular type of device and disables it with precision and a minimum of destructive force.'));
		specials.push(new Special('The Gyro-Inductor'         ,  0,    0,  0, 0,  20, 1<<7, 'The Gyro-Inductor allows a ship to generate power when it travels up the gravitational gradient of a planet. When the ship leaves orbit, the Gyro-Inductor creates power. It uses no power and takes effect automatically.'));
		specials.push(new Special('Plasma Coupler'            ,  4,   50,  0, 1,  20, 0   , 'The Plasma Coupler allows a ship to beam some of its power to another ship across a long distance.'));
		specials.push(new Special('Invulnerablizer'           , 20,    0,  0, 1,  60, 0   , 'The Invulnerablizer sets up a temporary high-magitechnology shield around the ship using it. While it lasts, the shield will not allow the ship to come to harm. It consumes little power but it is costly to build and can be used only once.'));
		specials.push(new Special('Phase Bomb'                ,  4,   25,  0, 1,  40, 0   , 'The Phase Bomb is launched at a planet and destroys structures on the planet\'s surface. It can be used only once and must be launched at short range.'));
		specials.push(new Special('Colonizer'                 ,  5,    0,  0, 0,  35, 1<<7, 'The Colonizer allows a ship to create a colony on an unoccupied planet. It carries a group of trained settlers and a prefabricated Colony Base that provides the tools necessary to grow a self-sufficient colony. The Colonizer is deployed from orbit and can be used only once.'));
		specials.push(new Special('Self Destructotron'        ,  0,    0, 20, 0,  50, 1<<6, 'The Self Destructotron is a desperation device. It destroys the ship using it by converting most of the ship\'s mass to energy, creating a huge explosion that greatly damages other ships nearby.'));
		specials.push(new Special('Invasion Module'           , 10,    0,  0, 0,  70, 1<<7, 'The Invasion Module transports a planetary infiltration team and their camouflaged base of operations to a planet\'s surface from orbit. It can be destroyed by a planetary Surface Shield unless multiple Invasion Modules are launched to overload the Surface Shield\'s tracking ability. It is expensive to assemble and can be used only once.'));
		specials.push(new Special('Mass Condensor'            ,  8,  100,  0, 1,  50, 0   , 'The Mass Condensor operates as the Gravitational Distorter, except that it is targeted at a ship. All ships will be attracted toward the affected ship. It works at a long range and consumes a lot of power.'));
		specials.push(new Special('Hyperfuel'                 ,  0,    0,  0, 0,  20, 1<<6, 'Hyperfuel is a one-time-use power reserve of great capacity. It is a cheap, disposable source of power.'));

		components = [noDevice].concat(
			weapons,
			shields,
			engines,
			scanners,
			generators,
			specials
		);

	})();

	//
	// Export
	//

	if (!window.ascend) {window.ascend = {};}

	window.ascend.kCOMP          = kCOMP;
	window.ascend.hulls          = hulls;
	window.ascend.components     = components;
	window.ascend.weapons        = weapons;
	window.ascend.shields        = shields;
	window.ascend.engines        = engines;
	window.ascend.scanners       = scanners;
	window.ascend.generators     = generators;
	window.ascend.specials       = specials;
	window.ascend.createShipPlan = createShipPlan;

})(window); //\/\/
