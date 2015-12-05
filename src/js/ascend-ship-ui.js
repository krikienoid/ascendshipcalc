/*!
 *
 * Ascendency Ship Analyzer
 *
 * Analyze ship builds in the game Ascendency.
 *
 */

;(function (window, $, ascend, undefined) {

    'use strict';

    //
    // Data
    //

    var view    = {},
        control = {},
        selectedComponentIndex = 0,
        shipPlan;

    //
    // Update View
    //

    function cleanNumber (n, d) {
        if (window.isNaN(d) || d < 0 || d > 20) {d = 2;}
        return window.parseFloat(n.toFixed(d));
    }

    function getComponentAttrFlagNumbers (attrFlags) {
        var result = '';
        for (var i = 0, ii = attrFlags.length; i < ii; i++) {
            if (result.length) {result += ', ';}
            result += attrFlags[i].index;
        }
        return result;
    }

    function updateRatingIcons (l, $elem, className) {
        var $icon;
        $elem.empty();
        while (l > 0) {
            $icon = $('<div/>')
                .addClass('levels-icon')
                .addClass(className);
            if      (l === 3) {$icon.addClass('frac-3-4');}
            else if (l === 2) {$icon.addClass('frac-1-2');}
            else if (l === 1) {$icon.addClass('frac-1-4');}
            $elem.append($icon);
            l -= 4;
        }
    }

    function createRatingIcons (l, className) {
        var $icons = $('<div/>');
        updateRatingIcons(l, $icons, className);
        return $icons;
    }

    function createComponentInfoTable (i) {

        var component = ascend.components[i],
            $levelRating,
            $powerRating;

        $levelRating = createRatingIcons(component.getRating(), component.type.className);
        if (component.type !== ascend.kCOMP.GNTR) {
            $powerRating = createRatingIcons(component.power, 'power');
        }
        else {
            $powerRating = $('<div/>');
        }

        if (component.uses > 1) {
            $levelRating.append($('<span/>').text('\u00a0x\u00a0' + component.uses));
            $powerRating.append($('<span/>').text('\u00a0x\u00a0' + component.uses));
        }

        return (
            $('<div/>')
                .addClass('component-info')
                .append(
                    $('<div/>')
                        .addClass('component-info')
                        .append(
                            $('<h4/>')
                                .text(component.name)
                                .append('&nbsp;')
                                .append(
                                    $('<small/>')
                                        .text('(' + component.type.name + ')')
                                )
                        )
                )
                .append(
                    $('<div/>')
                        .addClass('component-info-half')
                        .append(
                            $('<table/>')
                                .addClass('display-table')
                                .addClass('component-display-info')
                                .append(
                                    $('<tbody/>')
                                        .append(
                                            $('<tr/>')
                                                .append($('<td/>')
                                                    .append($levelRating.append('&nbsp;'))
                                                    .attr('colspan', 2))
                                        )
                                        .append(
                                            $('<tr/>')
                                                .append($('<td/>').text('Level'))
                                                .append($('<td/>').text(component.level))
                                        )
                                        .append(
                                            $('<tr/>')
                                                .append($('<td/>').text('Uses'))
                                                .append($('<td/>').text(component.uses))
                                        )
                                        .append(
                                            $('<tr/>')
                                                .append($('<td/>').text('Cost'))
                                                .append($('<td/>').text(component.cost))
                                        )
                                )
                        )
                )
                .append(
                    $('<div/>')
                        .addClass('component-info-half')
                        .append(
                            $('<table/>')
                                .addClass('display-table')
                                .addClass('component-display-info')
                                .append(
                                    $('<tbody/>')
                                        .append(
                                            $('<tr/>')
                                                .append($('<td/>')
                                                    .append($powerRating.append('&nbsp;'))
                                                    .attr('colspan', 2))
                                        )
                                        .append(
                                            $('<tr/>')
                                                .append($('<td/>').text('Power Use'))
                                                .append($('<td/>').text(component.power))
                                        )
                                        .append(
                                            $('<tr/>')
                                                .append($('<td/>').text('Range'))
                                                .append($('<td/>').text(component.range))
                                        )
                                        .append(
                                            $('<tr/>')
                                                .append($('<td/>').text('Flags'))
                                                .append($('<td/>').text(
                                                    getComponentAttrFlagNumbers(component.getAttrFlags())
                                                ))
                                        )
                                )
                        )
                )
        );

    }

    function updateComponentMenuDisplay () {

        var component = ascend.components[selectedComponentIndex],
            attrFlags = component.getAttrFlags(),
            popoverContent = [component.desc];

        popoverContent.push('<ul>');
        for (var i = 0, ii = attrFlags.length; i < ii; i++) {
            popoverContent.push('<li>');
            popoverContent.push(attrFlags[i].desc);
            popoverContent.push('</li>');
        }
        popoverContent.push('</ul>');

        view.menu.components.selected.disp
            .empty()
            .append(
                $('<div/>')
                    .addClass('component-display-left-col')
                    .append(
                        ascend.createComponentSprite(selectedComponentIndex)
                    )
                    .append(
                        view.menu.components.selected.desc
                            .popover({
                                html : true,
                                title : component.name,
                                content : popoverContent.join('')
                            })
                    )
            )
            .append(
                $('<div/>')
                    .addClass('component-display-main-col')
                    .append(createComponentInfoTable(selectedComponentIndex))
            );

    }

    function updateShipComponentSlotsVisibility () {
        var ii = shipPlan.equipment.length;
        control.ship.slots.each(function (i) {
            if (i < ii) {$(this).removeClass('hidden');}
            else        {$(this).addClass('hidden');}
        });
    }

    function updateShipCombatPowerTable () {

        var replenish       = shipPlan.getReplenisherCount(),
            attackMax       = shipPlan.getMaxAttack(),
            attackReplenish = attackMax * (replenish + 1),
            powerMax        = shipPlan.getWeaponMaxPowerUsage(),
            powerReplenish  = powerMax * (replenish + 1);

        view.ship.combat.replenish.text(replenish);

        view.ship.combat.attackMax.text(attackMax);
        updateRatingIcons(
            attackMax,
            view.ship.combat.icons.attackMax,
            'weapon'
        );

        view.ship.combat.powerMax.text(powerMax);
        updateRatingIcons(
            powerMax,
            view.ship.combat.icons.powerMax,
            'power'
        );

        if (replenish) {
            view.ship.combat.attackReplenish.text(attackReplenish);
            updateRatingIcons(
                attackReplenish ,
                view.ship.combat.icons.attackReplenish,
                'weapon'
            );
            view.ship.combat.powerReplenish.text(powerReplenish);
            updateRatingIcons(
                powerReplenish ,
                view.ship.combat.icons.powerReplenish,
                'power'
            );
        }
        else {
            view.ship.combat.attackReplenish.text(attackMax);
            updateRatingIcons(
                attackMax ,
                view.ship.combat.icons.attackReplenish,
                'weapon'
            );
            view.ship.combat.powerReplenish.text(powerMax);
            updateRatingIcons(
                powerMax ,
                view.ship.combat.icons.powerReplenish,
                'power'
            );
        }

    }

    function updateShipSpecialPowerTable () {
        var specialPowers = shipPlan.getSpecialPowerUsageDetail(),
            totalPower    = 0,
            count,
            power;
        view.ship.specPower.empty();
        for (var i in specialPowers) {
            if (specialPowers.hasOwnProperty(i)) {
                count = specialPowers[i].count;
                totalPower += power = specialPowers[i].power;
                view.ship.specPower
                    .append(
                        $('<tr/>')
                            .append($('<td/>').text(
                                ascend.components[i].name +
                                ((count > 1)? '\u00a0(' + count + ')' : '')
                            ))
                            .append($('<td/>').text(power))
                            .append($('<td/>').append(
                                createRatingIcons(power, 'power')
                            ))
                    );
            }
        }
        view.ship.specPower
            .append(
                $('<tr/>')
                    .append($('<td/>').text('Total'))
                    .append($('<td/>').text(totalPower))
                    .append($('<td/>').append(
                        createRatingIcons(totalPower, 'power')
                    ))
            );
    }

    function updateShipTables () {

        var levelWeapon  = shipPlan.getLevel(ascend.kCOMP.WEAP),
            levelShield  = shipPlan.getLevel(ascend.kCOMP.SHLD),
            levelEngine  = shipPlan.getLevel(ascend.kCOMP.ENGN),
            levelScanner = shipPlan.getLevel(ascend.kCOMP.SCAN),
            levelPower   = shipPlan.getLevel(ascend.kCOMP.GNTR);

        view.ship.hull.text(shipPlan.hull.name);

        control.ship.slots.each(function (i) {
            var component = (shipPlan.equipment[i])?
                    shipPlan.equipment[i] :
                    ascend.components[0];
            $(this)
                .empty()
                .append(ascend.createComponentSprite(component.getIndex()));
        });

        view.ship.levels.weapon .text(levelWeapon);
        view.ship.levels.shield .text(levelShield);
        view.ship.levels.engine .text(levelEngine);
        view.ship.levels.scanner.text(levelScanner);
        view.ship.levels.power  .text(levelPower);

        updateRatingIcons(levelWeapon,  view.ship.levels.icons.weapon,  'weapon');
        updateRatingIcons(levelShield,  view.ship.levels.icons.shield,  'shield');
        updateRatingIcons(levelEngine,  view.ship.levels.icons.engine,  'engine');
        updateRatingIcons(levelScanner, view.ship.levels.icons.scanner, 'scanner');
        updateRatingIcons(levelPower,   view.ship.levels.icons.power,   'power');

        view.ship.stats.cost      .text(shipPlan.getIndustryCost());
        view.ship.stats.health    .text(shipPlan.hull.health);
        view.ship.stats.shieldTime.text(shipPlan.getShieldDuration());
        view.ship.stats.moveMax   .text(cleanNumber(shipPlan.getMaxMovement()));
        view.ship.stats.weaponEff .text(cleanNumber(shipPlan.getWeaponEfficiency()));
        view.ship.stats.shieldEff .text(cleanNumber(shipPlan.getShieldEfficiency()));
        view.ship.stats.engineEff .text(cleanNumber(shipPlan.getEngineEfficiency()));
        view.ship.stats.scannerEff.text(cleanNumber(shipPlan.getScannerRange()));

        updateShipCombatPowerTable();
        updateShipSpecialPowerTable();

    }

    function updateShip () {
        updateShipComponentSlotsVisibility();
        updateShipTables();
    }

    function update () {
        updateComponentMenuDisplay();
        updateShip();
    }

    //
    // Init
    //

    function init () {

        function initDocumentReferences () {

            view.ship = {};
            view.ship.hull = $('#ascend-ship-hull-size');
            view.ship.levels         = {};
            view.ship.levels.weapon  = $('#ascend-ship-levels-weapon');
            view.ship.levels.shield  = $('#ascend-ship-levels-shield');
            view.ship.levels.engine  = $('#ascend-ship-levels-engine');
            view.ship.levels.scanner = $('#ascend-ship-levels-scanner');
            view.ship.levels.power   = $('#ascend-ship-levels-power');
            view.ship.levels.icons         = {};
            view.ship.levels.icons.weapon  = $('#ascend-ship-levels-icons-weapon');
            view.ship.levels.icons.shield  = $('#ascend-ship-levels-icons-shield');
            view.ship.levels.icons.engine  = $('#ascend-ship-levels-icons-engine');
            view.ship.levels.icons.scanner = $('#ascend-ship-levels-icons-scanner');
            view.ship.levels.icons.power   = $('#ascend-ship-levels-icons-power');
            view.ship.stats            = {};
            view.ship.stats.cost       = $('#ascend-ship-stats-cost');
            view.ship.stats.health     = $('#ascend-ship-stats-health');
            view.ship.stats.moveMax    = $('#ascend-ship-stats-move-max');
            view.ship.stats.shieldTime = $('#ascend-ship-stats-shield-time');
            view.ship.stats.weaponEff  = $('#ascend-ship-stats-weapon-eff');
            view.ship.stats.shieldEff  = $('#ascend-ship-stats-shield-eff');
            view.ship.stats.engineEff  = $('#ascend-ship-stats-engine-eff');
            view.ship.stats.scannerEff = $('#ascend-ship-stats-scanner-eff');
            view.ship.combat                 = {};
            view.ship.combat.replenish       = $('#ascend-ship-combat-replenish');
            view.ship.combat.attackMax       = $('#ascend-ship-combat-attack-max');
            view.ship.combat.attackReplenish = $('#ascend-ship-combat-attack-replenish');
            view.ship.combat.powerMax        = $('#ascend-ship-combat-power-max');
            view.ship.combat.powerReplenish  = $('#ascend-ship-combat-power-replenish');
            view.ship.combat.icons                 = {};
            view.ship.combat.icons.attackMax       = $('#ascend-ship-combat-icons-attack-max');
            view.ship.combat.icons.attackReplenish = $('#ascend-ship-combat-icons-attack-replenish');
            view.ship.combat.icons.powerMax        = $('#ascend-ship-combat-icons-power-max');
            view.ship.combat.icons.powerReplenish  = $('#ascend-ship-combat-icons-power-replenish');
            view.ship.specPower = $('#ascend-ship-special-power');
            view.menu = {};
            view.menu.components = {};
            view.menu.components.selected      = {};
            view.menu.components.selected.disp = $('#ascend-component-menu-selected-display');
            view.menu.components.selected.desc = $('#ascend-component-menu-selected-desc');

            control.ship          = {};
            control.ship.hull     = $('#ascend-ship-hull-select');
            control.ship.clear    = $('#ascend-ship-clear');
            control.ship.slotsArr = $('#ascend-ship-component-slots-arr');
            control.ship.slots    = null;
            control.components        = {};
            control.components.menu   = $('#ascend-component-menu-items-arr');
            control.components.groups = $('#ascend-component-groups');
            control.components.group         = {};
            control.components.group.all     = $('#ascend-component-group-all');
            control.components.group.weapon  = $('#ascend-component-group-weapon');
            control.components.group.shield  = $('#ascend-component-group-shield');
            control.components.group.engine  = $('#ascend-component-group-engine');
            control.components.group.scanner = $('#ascend-component-group-scanner');
            control.components.group.power   = $('#ascend-component-group-power');
            control.components.group.special = $('#ascend-component-group-special');

        }

        function initComponentMenu () {

            var groupName = '';

            for (var i = 0, ii = ascend.components.length; i < ii; i++) {
                switch (ascend.components[i].type) {
                    case ascend.kCOMP.NONE : groupName = 'none';    break;
                    case ascend.kCOMP.WEAP : groupName = 'weapon';  break;
                    case ascend.kCOMP.SHLD : groupName = 'shield';  break;
                    case ascend.kCOMP.ENGN : groupName = 'engine';  break;
                    case ascend.kCOMP.SCAN : groupName = 'scanner'; break;
                    case ascend.kCOMP.GNTR : groupName = 'power';   break;
                    case ascend.kCOMP.SPEC : groupName = 'special'; break;
                }
                control.components.menu
                    .append(
                        $('<div/>')
                            .addClass('component-menu-item')
                            .addClass(groupName)
                            .append(ascend.createComponentSprite(i, true))
                            .data('index', i)
                    );
            }

            control.components.menu
                .delegate('.component-menu-item', 'click', function () {
                    selectedComponentIndex = window.parseInt($(this).data('index'));
                    updateComponentMenuDisplay();
                });

        }

        function initComponentMenuGroups () {

            control.components.group.all    .attr('data-group-name', 'all');
            control.components.group.weapon .attr('data-group-name', 'weapon');
            control.components.group.shield .attr('data-group-name', 'shield');
            control.components.group.engine .attr('data-group-name', 'engine');
            control.components.group.scanner.attr('data-group-name', 'scanner');
            control.components.group.power  .attr('data-group-name', 'power');
            control.components.group.special.attr('data-group-name', 'special');

            control.components.groups
                .delegate('button', 'click', function () {
                    control.components.menu.attr(
                        'data-group-name',
                        $(this).attr('data-group-name')
                    );
                });

            control.components.group.weapon.trigger('click');

        }

        function initShipHullSelect () {
            for (var i = 0, ii = ascend.hulls.length; i < ii; i++) {
                control.ship.hull.append(
                    $('<li/>').append(
                        $('<a/>')
                            .val(i)
                            .text(ascend.hulls[i].name)
                    )
                );
            }
            control.ship.hull.delegate('a', 'click', function () {
                shipPlan.setHull(window.parseInt(this.value));
                updateShip();
            });
            control.ship.clear.on('click', function () {
                shipPlan.equipComponentArr();
                updateShip();
            });
        }

        function initShipComponentSlots () {
            for (var i = 0, ii = ascend.hulls[ascend.hulls.length - 1].slots; i < ii; i++) {
                control.ship.slotsArr
                    .append(
                        $('<div/>')
                            .addClass('ship-component-slot')
                            .data('index', i)
                    );
            }
            control.ship.slotsArr
                .delegate('.ship-component-slot', 'click', function () {
                    shipPlan.equipComponent(
                        window.parseInt($(this).data('index')),
                        selectedComponentIndex
                    );
                    updateShipTables();
                })
                .delegate('.ship-component-slot', 'contextmenu', function () {
                    shipPlan.equipComponent(
                        window.parseInt($(this).data('index')),
                        0
                    );
                    updateShipTables();
                    return false;
                });
            control.ship.slots = control.ship.slotsArr.children('.ship-component-slot');
        }

        shipPlan = ascend.createShipPlan();

        initDocumentReferences();
        initComponentMenu();
        initComponentMenuGroups();
        initShipHullSelect();
        initShipComponentSlots();

        update();

    }

    $(window.document).ready(init);

    //
    // Export
    //

    if (!window.ascend) {window.ascend = {};}

    ascend.app = {};
    ascend.app.getShipPlan = function () {return shipPlan;};
    ascend.app.update   = update;

})(window, jQuery, window.ascend); //\/\/
