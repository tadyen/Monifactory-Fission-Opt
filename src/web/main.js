$(() => { FissionOpt().then((FissionOpt) => {
  const run = $('#run'), pause = $('#pause'), stop = $('#stop');
  let opt = null, timeout = null;
  
  const updateDisables = () => {
    $('#settings input').prop('disabled', opt !== null);
    $('#settings a')[opt === null ? 'removeClass' : 'addClass']('disabledLink');
    run[timeout === null ? 'removeClass' : 'addClass']('disabledLink');
    pause[timeout !== null ? 'removeClass' : 'addClass']('disabledLink');
    stop[opt !== null ? 'removeClass' : 'addClass']('disabledLink');
  };

  const fuelBasePower = $('#fuelBasePower');
  const fuelBaseHeat = $('#fuelBaseHeat');
  const fuelPresets = {
    TBU: [4800, 18],
    LEU235: [9600, 50],
    HEU235: [38400, 300],
    LEU233: [11520, 60],
    HEU233: [46080, 360],
    LEN236: [7200, 36],
    HEN236: [28800, 216],
    LEP239: [8400, 40],
    HEP239: [33600, 240],
    LEP241: [13200, 70],
    HEP241: [52800, 420],
    LEA242: [15360, 94],
    HEA242: [61440, 564],
    LECm243: [16800, 112],
    HECm243: [67200, 672],
    LECm245: [12960, 68],
    HECm245: [51840, 408],
    LECm247: [11040, 54],
    HECm247: [44160, 324],
    LEB248: [1080, 52], // Note: All other fuels are 80x that of the NC default in Monifactory, except this one (8x). I believe it's a typo in Monifactory (missing a 0), but I kept the (likely erroneous) value to align with the current version of the modpack.
    HEB248: [43200, 312],
    LECf249: [17280, 116],
    HECf249: [69120, 696],
    LECf251: [18000, 120],
    HECf251: [72000, 720],
  };
  const fuelButtons = [];
  (() => {
    for (const [name, [power, heat]] of Object.entries(fuelPresets)){
      fuelButtons.push({
        name: name,
        power: power,
        heat: heat,
        target: $('#' + name)
      });
    }
  })();
  
  fuelButtons.forEach((entry)=>{
    if (opt !== null)
      return;
    $(entry.target.click( (e)=>{
      (() => {
        fuelButtons.forEach((e)=>{
          e.target.parent().removeClass('selected');
        });
      })();
      fuelBasePower.val(entry.power);
      fuelBaseHeat.val(entry.heat);
      $(e.target).parent().addClass('selected');
    }));
  })

  const schedule = () => {
    timeout = window.setTimeout(step, 0);
  };
  
  // Order of entries matters
  const heatSinks = [
    {name: "Wt", title:"Water", rate:60, activeRate:150},
    {name: "Rs", title:"Redstone", rate:90, activeRate:270},
    {name: "Qz", title:"Quartz", rate:90, activeRate:0},
    {name: "Au", title:"Gold", rate:120, activeRate:0},
    {name: "Gs", title:"Glowstone", rate:130, activeRate:0},
    {name: "Lp", title:"Lapis", rate:120, activeRate:0},
    {name: "Dm", title:"Diamond", rate:150, activeRate:0},
    {name: "He", title:"Liquid Helium", rate:140, activeRate:420},
    {name: "Ed", title:"Enderium", rate:120, activeRate:360},
    {name: "Cy", title:"Cryotheum", rate:160, activeRate:480},
    {name: "Fe", title:"Iron", rate:80, activeRate:0},
    {name: "Em", title:"Emerald", rate:160, activeRate:0},
    {name: "Cu", title:"Copper", rate:80, activeRate:0},
    {name: "Sn", title:"Tin", rate:120, activeRate:0},
    {name: "Mg", title:"Magnesium", rate:110, activeRate:0},
    {name: "Al", title:"Aluminium", rate:175, activeRate:0},
    {name: "As", title:"Arsenic", rate:135, activeRate:0},
    {name: "B", title:"Boron", rate:160, activeRate:0},
    {name: "ES", title:"EndStone", rate:40, activeRate:0},
    {name: "Ft", title:"Fluorite", rate:160, activeRate:0},
    {name: "Pb", title:"Lead", rate:60, activeRate:0},
    {name: "N", title:"Liquid Nitrogen", rate:185, activeRate:0},
    {name: "Li", title:"Lithium", rate:130, activeRate:0},
    {name: "Mn", title:"Manganese", rate:150, activeRate:0},
    {name: "NB", title:"Nether Brick", rate:70, activeRate:0},
    {name: "Nr", title:"Netherite", rate:150, activeRate:0},
    {name: "Ob", title:"Obsidian", rate:40, activeRate:0},
    {name: "Pm", title:"Prismarine", rate:115, activeRate:0},
    {name: "Pp", title:"Purpur", rate:95, activeRate:0},
    {name: "Ag", title:"Silver", rate:170, activeRate:0},
    {name: "Sl", title:"Slime", rate:145, activeRate:0},
  ];
  const otherBlocks = [
    {name: "[]", title:"Reactor Cell"},
    {name: "##", title:"Moderator"},
    {name: "..", title:"Air"},
  ];
  const nCoolerTypes = heatSinks.length;
  const air = nCoolerTypes*2 + otherBlocks.length - 1;
  const tileNames = [ ...heatSinks.map((e)=>e.name), ...otherBlocks.map((e)=>e.name) ];
  const tileTitles = [ ...heatSinks.map((e)=>e.title), ...otherBlocks.map((e)=>e.title) ];
  
  // class names for css
  const tileClasses = tileNames.slice();
  tileClasses[nCoolerTypes] = 'cell';
  tileClasses[nCoolerTypes + 1] = 'mod';
  tileClasses[nCoolerTypes + 2] = 'air';

  const rates = [], limits = [];
  $('#rate input').each(function() { rates.push($(this)); });
  $('#activeRate input').each(function() { rates.push($(this)); });
  $('#limit input').each(function() { limits.push($(this)); });
  {
    const tail = limits.splice(-2);
    $('#activeLimit input').each(function() { limits.push($(this)); });
    limits.push(...tail);
  }
  const loadRatePreset = (preset) => {
    if (opt !== null)
      return;
    $.each(rates, (i, x) => { x.val(preset[i]); });
  };
  $('#DefRate').click(()=>{ loadRatePreset([ ...heatSinks.map((e)=>e.rate), ...heatSinks.map((e)=>e.activeRate) ]) });
  // Overwrite names
  const tileSaveNames = tileTitles.slice();
  tileSaveNames[7] = 'Helium';
  tileSaveNames[21] = 'Nitrogen';
  tileSaveNames[nCoolerTypes] = 'FuelCell';
  tileSaveNames[nCoolerTypes + 1] = 'Graphite';
  
  const settings = new FissionOpt.FissionSettings();
  const design = $('#design');
  const save = $('#save');
  $('#blockType>:not(:first)').each((i, x) => { $(x).attr('title', tileTitles[i]); });

  const displayTile = (tile) => {
    let active = false;
    if (tile >= nCoolerTypes) {
      tile -= nCoolerTypes;
      if (tile < nCoolerTypes)
        active = true;
    }
    const result = $(
      '<span>' 
      + (tileNames[tile].length == 1 ? tileNames[tile] + '&nbsp;' : tileNames[tile])
      + '</span>'
    ).addClass(tileClasses[tile]);
    if (active) {
      result.attr('title', 'Active ' + tileTitles[tile]);
      result.css('outline', '2px dashed black')
    } else {
      result.attr('title', tileTitles[tile]);
    }
    return result;
  };

  const saveTile = (tile) => {
    if (tile >= nCoolerTypes) {
      tile -= nCoolerTypes;
      if (tile < nCoolerTypes) {
        return "Active " + tileSaveNames[tile];
      }
    }
    return tileSaveNames[tile];
  };

  const displaySample = (sample) => {
    design.empty();
    let block = $('<div></div>');
    const appendInfo = (label, value, unit) => {
      const row = $('<div></div>').addClass('info');
      row.append('<div>' + label + '</div>');
      row.append('<div>' + unit + '</div>');
      row.append(Math.round(value * 100) / 100);
      block.append(row);
    };
    appendInfo('Model Fitness', sample.getFitness(), 'dimless');
    appendInfo('Max Power', sample.getPower(), 'RF/t');
    appendInfo('Heat', sample.getHeat(), 'H/t');
    appendInfo('Cooling', sample.getCooling(), 'H/t');
    appendInfo('Net Heat', sample.getNetHeat(), 'H/t');
    appendInfo('Duty Cycle', sample.getDutyCycle() * 100, '%');
    appendInfo('Fuel Use Rate', sample.getAvgBreed(), '&times;');
    appendInfo('Efficiency', sample.getEfficiency() * 100, '%');
    appendInfo('Avg Power', sample.getAvgPower(), 'RF/t');
    design.append(block);

    const shapes = [], strides = [], data = sample.getData();
    for (let i = 0; i < 3; ++i) {
      shapes.push(sample.getShape(i));
      strides.push(sample.getStride(i));
    }
    let resourceMap = {};
    const saved = {
      UsedFuel: {name: '', FuelTime: 0.0, BasePower: settings.fuelBasePower, BaseHeat: settings.fuelBaseHeat},
      SaveVersion: {Major: 1, Minor: 2, Build: 24, Revision: 0, MajorRevision: 0, MinorRevision: 0},
      InteriorDimensions: {X: shapes[2], Y: shapes[0], Z: shapes[1]},
      CompressedReactor: {}
    };
    resourceMap[-1] = (shapes[0] * shapes[1] + shapes[1] * shapes[2] + shapes[2] * shapes[0]) * 2;
    for (let x = 0; x < shapes[0]; ++x) {
      block = $('<div></div>');
      block.append('<div>Layer ' + (x + 1) + '</div>');
      for (let y = 0; y < shapes[1]; ++y) {
        const row = $('<div></div>').addClass('row');
        for (let z = 0; z < shapes[2]; ++z) {
          if (z)
            row.append(' ');
          const tile = data[x * strides[0] + y * strides[1] + z * strides[2]];
          if (!resourceMap.hasOwnProperty(tile))
            resourceMap[tile] = 1;
          else
            ++resourceMap[tile];
          const savedTile = saveTile(tile);
          if (savedTile !== undefined) {
            if (!saved.CompressedReactor.hasOwnProperty(savedTile))
              saved.CompressedReactor[savedTile] = [];
            saved.CompressedReactor[savedTile].push({X: z + 1, Y: x + 1, Z: y + 1});
          }
          row.append(displayTile(tile));
        }
        block.append(row);
      }
      design.append(block);
    }

    save.removeClass('disabledLink');
    save.off('click').click(() => {
      const elem = document.createElement('a');
      const url = window.URL.createObjectURL(new Blob([JSON.stringify(saved)], {type: 'text/json'}));
      elem.setAttribute('href', url);
      elem.setAttribute('download', 'reactor.json');
      elem.click();
      window.URL.revokeObjectURL(url);
    });

    block = $('<div></div>');
    block.append('<div>Total number of blocks used</div>')
    resourceMap = Object.entries(resourceMap);
    resourceMap.sort((x, y) => y[1] - x[1]);
    for (resource of resourceMap) {
      if (resource[0] == air)
        continue;
      const row = $('<div></div>');
      if (resource[0] < 0)
        row.append('Casing');
      else
        row.append(displayTile(resource[0]).addClass('row'));
      block.append(row.append(' &times; ' + resource[1]));
    }
    design.append(block);
  };

  const progress = $('#progress');
  let lossElement, lossPlot;
  function step() {
    schedule();
    opt.stepInteractive();
    const nStage = opt.getNStage();
    if (nStage == -2)
      progress.text('Episode ' + opt.getNEpisode() + ', training iteration ' + opt.getNIteration());
    else if (nStage == -1)
      progress.text('Episode ' + opt.getNEpisode() + ', inference iteration ' + opt.getNIteration());
    else
      progress.text('Episode ' + opt.getNEpisode() + ', stage ' + nStage + ', iteration ' + opt.getNIteration());
    if (opt.needsRedrawBest())
      displaySample(opt.getBest());
    if (opt.needsReplotLoss()) {
      const data = opt.getLossHistory();
      while (lossPlot.data.labels.length < data.length)
        lossPlot.data.labels.push(lossPlot.data.labels.length);
      lossPlot.data.datasets[0].data = data;
      lossPlot.update({duration: 0});
    }
  };

  run.click(() => {
    if (timeout !== null)
      return;
    if (opt === null) {
      const parseSize = (x) => {
        const result = parseInt(x);
        if (!(result > 0))
          throw Error("Core size must be a positive integer");
        return result;
      };
      const parsePositiveInt = (name, x) => {
        const result = parseInt(x);
        if (!(result > 0))
          throw Error(name + " must be a positive integer greater than 0");
        return result;
      };
      const parsePositiveFloat = (name, x) => {
        const result = parseFloat(x);
        if (!(result >= 0))
          throw Error(name + " must be a positive number");
        return result;
      };
      const parseZeroToOneHPercent = (name, x) => {
        const result = parseFloat(x);
        if (!(result >=0 && result <= 100))
          throw Error(name + " must be between 0 to 100");
        return result;
      }
      const parseZeroToOne = (name, x) => {
        const result = parseFloat(x);
        if (!(result >= 0 && result <= 1))
          throw Error(name + " must be between 0 to 1");
        return result;
      }
      try {
        settings.sizeX = parseSize($('#sizeX').val());
        settings.sizeY = parseSize($('#sizeY').val());
        settings.sizeZ = parseSize($('#sizeZ').val());
        settings.fuelBasePower = parsePositiveFloat('Fuel Base Power', fuelBasePower.val());
        settings.fuelBaseHeat = parsePositiveFloat('Fuel Base Heat', fuelBaseHeat.val());
        settings.ensureActiveCoolerAccessible = $('#ensureActiveCoolerAccessible').is(':checked');
        settings.ensureHeatNeutral = $('#ensureHeatNeutral').is(':checked');
        settings.applyAdditionalGoals = $('#applyAdditionalGoals').is(':checked');
        settings.goal = parseInt($('input[name=goal]:checked').val());
        if(settings.applyAdditionalGoals){
          settings.goalWeightPrimary = parseZeroToOne('Weight Primary', $('#goalWeightPrimary').val());
          settings.goalWeightSecondary = parseZeroToOne('Weight Secondary',  $('#goalWeightSecondary').val());
          settings.goalNetHeat = parseInt($('#goalNetHeat').val());
          settings.goalDutyCycle = parseZeroToOneHPercent('target Duty Cycle', $('#goalDutyCycle').val()) / 100;
          settings.goalFuelCells = parsePositiveInt('target Fuel Cells', $('#goalFuelCells').val());
          settings.goalWeightNetHeat = parseZeroToOne('target Net Heat weight', $('#goalWeightNetHeat').val());
          settings.goalWeightDutyCycle = parseZeroToOne('target Duty Cycle weight', $('#goalWeightDutyCycle').val());
          settings.goalWeightFuelCells = parseZeroToOne('target Fuel Cells weight', $('#goalWeightFuelCells').val());
        }
        settings.symX = $('#symX').is(':checked');
        settings.symY = $('#symY').is(':checked');
        settings.symZ = $('#symZ').is(':checked');
        $.each(rates, (i, x) => { settings.setRate(i, parsePositiveFloat('Cooling Rate', x.val())); });
        $.each(limits, (i, x) => {
          x = parseInt(x.val());
          settings.setLimit(i, x >= 0 ? x : -1);
        });
      } catch (error) {
        alert('Error: ' + error.message);
        return;
      }
      design.empty();
      save.off('click');
      save.addClass('disabledLink');
      if (lossElement !== undefined)
        lossElement.remove();
      const useNet = $('#useNet').is(':checked');
      if (useNet) {
        lossElement = $('<canvas></canvas>').attr('width', 1024).attr('height', 128).insertAfter(progress);
        lossPlot = new Chart(lossElement[0].getContext('2d'), {
          type: 'bar',
          options: {responsive: false, animation: {duration: 0}, hover: {animationDuration: 0}, scales: {xAxes: [{display: false}]}, legend: {display: false}},
          data: {labels: [], datasets: [{label: 'Loss', backgroundColor: 'red', data: [], categoryPercentage: 1.0, barPercentage: 1.0}]}
        });
      }
      opt = new FissionOpt.FissionOpt(settings, useNet);
    }
    schedule();
    updateDisables();
  });

  pause.click(() => {
    if (timeout === null)
      return;
    window.clearTimeout(timeout);
    timeout = null;
    updateDisables();
  });

  stop.click(() => {
    if (opt === null)
      return;
    if (timeout !== null) {
      window.clearTimeout(timeout);
      timeout = null;
    }
    opt.delete();
    opt = null;
    updateDisables();
  });

  $(document).ready(()=>{
    $('#DefRate').click();
  })
}); });
