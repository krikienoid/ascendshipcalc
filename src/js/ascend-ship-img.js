/*!
 *
 * Ascendency Ship Analyzer
 *
 * Analyze ship builds in the game Ascendency.
 *
 */

;(function (window, $, undefined) {

	'use strict';

	//
	// Data
	//

	var componentSpriteWidth  = 74,
		componentSpriteHeight = 56,
		componentSpritePos;

	//
	// Sprites
	//

	function createComponentSprite (i, isLabeled) {
		var pos = componentSpritePos[i],
			cx  = -componentSpriteWidth  * pos.x,
			cy  = -componentSpriteHeight * pos.y,
			$sprite = $('<div/>')
				.addClass('component-display')
				.append(
					$('<div/>')
						.addClass('component-sprite')
						.css({'backgroundPosition' : cx + 'px ' + cy + 'px'})
				);
		if (isLabeled) {
			$sprite
				.addClass('labeled')
				.prepend(
					$('<div/>')
						.addClass('component-name')
						.append(
							$('<small/>').text(ascend.components[i].name)
						)
				);
		}
		return $sprite;
	}

	//
	// Init
	//

	;(function initComponentSpritePos () {

		componentSpritePos = [];

		// No Device
		componentSpritePos.push({x : 11, y : 6});

		// Weapons
		for (var i = 0; i < 10; i++) componentSpritePos.push({x : i, y : 0});

		// Shields and Engines
		for (var i = 0; i < 11; i++) componentSpritePos.push({x : i, y : 1});

		// Scanners and Generators
		for (var i = 0; i < 11; i++) componentSpritePos.push({x : i, y : 2});

		// Specials
		for (var i = 0; i < 44; i++) {
			componentSpritePos.push({
				x : i % 12,
				y : 3 + Math.floor(i / 12)
			});
		}

	})();

	//
	// Export
	//

	if (!window.ascend) {window.ascend = {};}

	window.ascend.createComponentSprite = createComponentSprite;

})(window, jQuery); //\/\/
