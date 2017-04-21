console.log('Cuisine Recipe project');

var m = {t:50,r:50,b:50,l:50},
w = document.getElementById('plot1').clientWidth - m.l - m.r,
h = document.getElementById('plot1').clientHeight - m.t - m.b;

var ingreCuisinePairing = [];
var ingrePairing;
var cuisineSimilarityMatrix;

var nestedCuisines;
var filteredCuisines;
var filteredData;
var filteredIngredients;

var allIngredients = {};
var allCuisines = [];
var sortedCuisines = [
    'Japanese', 'Chinese', 'Asian', 'Vietnamese', 'Thai' ,'Indian',
    'MiddleEastern', 'Greek',
    'Mediterranean', 'Spanish_Portuguese', 'Italian', 'EasternEuropean_Russian', 'Jewish', 'French',  'German',
    'English_Scottish', 'Irish', 'Scandinavian', 'American', 'Southern_SoulFood', 'Cajun_Creole',
    'Southwestern', 'Mexican', 'Central_SouthAmerican',
    'African', 'Moroccan'];

var rectIngredientWidth = 24, rectIngredientHeight = 24;

var cellSize = 28, col_number= 26, row_number= 350;
var ingredientColId, ingredientRowId, r = 10;

var plots = d3.selectAll('.plot')
	.append('svg')
	.attr('width', w + m.l + m.r)
	.attr('height', h + m.t + m.b)
	.append('g')
	.attr('class','canvas')
	.attr('transform','translate('+m.l+','+m.t+')');

var plot1 = plots.filter(function(d,i){ return i===0;}),
    plot2 = plots.filter(function(d,i){ return i===1;})
    plot3 = plots.filter(function(d,i){ return i===2;})
    plot4 = plots.filter(function(d,i){ return i===3;});

var scaleXCuisine = d3.scaleLinear()
  .domain([0,3])
  .range([0,w]);

var scaleYIngredient = d3.scaleLinear()
  .domain([0,100])
  .range([0,h]);

var scaleLineWidth = d3.scaleLinear()
  .domain([0,1000])
  .range([0,10]);

//Draw axis
var scaleYbar = d3.scaleLinear()
    .domain([0,10])
    .range([0,h]);
var scaleXbar = d3.scaleLinear()
    .domain([0,1])
    .range([0,w/2]);
// var axisY = d3.axisLeft()
//     .scale(scaleY)
//     .tickSize(-w-200);

var scaleColor = d3.scaleOrdinal()
  .range(['#fd6b5a','#03afeb','orange']);
var scaleColorMatrix = d3.scaleLinear()
  .domain([0,0.82])
  .range(["white","#36802d"]);
var scaleColorCuisineMatrix = d3.scaleLinear()
  .domain([0,1])
  .range(["white","#36802d"]);
var scaleColorPlot2 = d3.scaleLinear()
  .domain([0,1])
  .range(["white","#36802d"]);
var colorScale20c = d3.scaleOrdinal().range(d3.schemeCategory20c);

var scaleOpacity = d3.scaleLinear()
  .domain([0,2000])
  .range([0,1]);

// //---------------------------- Chord Variables ---------------------------------
// var outerRadius = Math.min(w, h) / 2  - 100,
//   innerRadius = outerRadius * 0.95,
// 	opacityDefault = 0.7; //default opacity of chords
// //
// var matrix = [];
//
// var chord = d3.chord()
//   .padAngle(0.05)
//   .sortSubgroups(d3.descending);//sort the chords inside an arc from high to low
// 	// .sortChords(d3.descending) //which chord should be shown on top when chords cross. Now the biggest chord is at the bottom
// 	// .matrix(matrix);
//
// var arc = d3.arc()
// 	.innerRadius(innerRadius)
// 	.outerRadius(outerRadius);
//
// var ribbon = d3.ribbon()
//     .radius(innerRadius);

d3.queue()
  .defer(d3.csv, 'data/modifiedrecipe.csv', parse)
  .await(dataloaded);

function dataloaded(err, data){
  preprocessData(data);
  draw();
}

function preprocessData(data) {
  nestedCuisines = d3.nest()
    .key(function(d) {return d.region;})
    .key(function(d) {return d.cuisine;})
    .entries(data);

  filterData(data);

  var newSorted = [];
  for (var i = 0; i < sortedCuisines.length; i++) {
    if (filteredCuisines.includes(sortedCuisines[i])) {
      newSorted.push(sortedCuisines[i]);
    }
  }
  sortedCuisines = newSorted;

  ingrePairing = prepareIngreToIngrePairing(data,filteredIngredients);
  ingreCuisinePairing = prepareIngreToCuisinePairing(data);
  cuisineSimilarityMatrix = prepareCuisineSimilarityMatrix();
}

function filterData(data) {

  filteredCuisines = allCuisines.filter(function(d){
    return cuisineTotalDishes(d) > 0;
  });

  filteredData = data.filter(function(d){
    return true;
  });

  filteredIngredients = Object.values(allIngredients);
  filteredIngredients = filteredIngredients.filter(function(d){
    return d.count > 100; //1000
  });
  row_number = filteredIngredients.length;

  for (var i = 0; i < filteredIngredients.length; i++) {
    filteredIngredients[i].index = i ;
  }

  sortedFilteredIngredients = filteredIngredients.sort(function (a, b) {
    return b.count - a.count;
  });
}

function getIngredientIndex(filteredIngredients,ingredientName) {
  var index;

  for (var i = 0; i < sortedCuisines.length; i++) {
    // console.log(sortedCuisines[i]);
    for (var j = 0; j < filteredIngredients.length; j++) {
      if (ingredientName == filteredIngredients[j].name) {
        index = filteredIngredients[j].index; // find the index (with object)
        return index;
      }
    }
    return -1; // if not found
  }
}

// prepareIngreToIngreMatrix returns a matrix given a certain data.
// The matrix maps from one ingredient to another ingredient. The value in
// the matrix is the number of co-occurance of the two ingredients.
// The data are a list of dishes.
function prepareIngreToIngreMatrix(data){
  // console.log(data);
  var matrix = {};
  for (var i = 0; i < data.length; i++) {
    var ingredients = data[i].ingredients;
    // console.log(ingredients);
    for (var j = 0; j < ingredients.length; j++) {
      var ingredient = ingredients[j];

      // Create a matrix row if the ingredient is not in the matrix
      if (matrix[ingredient] === undefined) {
        matrix[ingredient] = {};
      }

      // Find the pairs and counts of that particular ingredient
      for (var k = 0; k < ingredients.length; k++) {
        var ingredient2 = ingredients[k];
        if (matrix[ingredient][ingredient2] === undefined) {
          matrix[ingredient][ingredient2] = 0;
        }
        matrix[ingredient][ingredient2] ++;
      }
    }
  }
  // console.log(matrix);
  return matrix;
}

// prepareIngreToIngrePairing returns a dictionary of ingredient to ingredient
// paring matrix. The key of the dictionary is the name of the cuisine.
function prepareIngreToIngrePairing(data,filteredIngredients) {
  var ingrePairing = {};
  for (var i = 0; i < sortedCuisines.length; i++) {
    ingrePairing[sortedCuisines[i]] = prepareIngreToIngreMatrix(
      data.filter(function(d){
        return d.cuisine === sortedCuisines[i];
      })
    );
  }
  console.log(ingrePairing);
  return ingrePairing;
}

function prepareIngreToCuisinePairing(data) {
  pairing = [];

  for (var i = 0; i < sortedCuisines.length; i++) {
    // filteredCuisines[i]
    for (var j = 0; j < filteredIngredients.length; j++) {
      var element = {};
      element.cuisine = sortedCuisines[i];
      element.count = 0;
      element.ingredient = filteredIngredients[j];
      pairing.push(element);
    }
  }

  for (var i = 0; i < data.length; i++) {
    for (var j = 0; j < data[i].ingredients.length; j++) {
      for (var k = 0; k < pairing.length; k++) { //find element by cuisine & ingredients
        if (data[i].ingredients[j] == pairing[k].ingredient.name &&
            data[i].cuisine == pairing[k].cuisine) { // find the index (with object)
          pairing[k].count ++;
          break;
        }
      }
    }
  }
  // console.log('pairing'+pairing);

  return pairing
}

function prepareCuisineSimilarityMatrix() {
  var m = [];
  var max = 0;
  var min = Number.MAX_VALUE;
  for (var i = 0; i < filteredCuisines.length; i++) {
    // m.push([]);
    for (var j = 0; j < filteredCuisines.length; j++) {
      var similarity = calculateCuisineSimilarity(i, j)
      // m[i].push(similarity);
      m.push(similarity);

      if (i != j && similarity > max) {
        max = similarity;
      }

      if (i != j && similarity < min) {
        min = similarity;
      }
    }
  }

  for (var i = 0; i < filteredCuisines.length; i++) {
    // m.push([]);
    for (var j = 0; j < filteredCuisines.length; j++) {
      if (i === j) {
        // m[i * filteredCuisines.length + j] = 1;
      } else {
        m[i * filteredCuisines.length + j] =
          (m[i * filteredCuisines.length + j] - min) / (max - min);
      }
    }
  }

  return m;
}

// calculateCuisineSimilarity returns a value between 0 and 1 that represents
// how similar two cuisines are. The input arguments are i and j, which are
// the cuisine indexes in the filteredCuisines list.
function calculateCuisineSimilarity(i, j) {
  if (i === j) return 1;

  var similarity = 0;
  var cuisine1 = sortedCuisines[i];
  var totalDishesCuisine1 = cuisineTotalDishes(cuisine1);
  var cuisine2 = sortedCuisines[j];
  var totalDishesCuisine2 = cuisineTotalDishes(cuisine2);
  var totalIngre = filteredIngredients.length
  for (var k = 0; k < totalIngre; k++) {
    var ingreName = filteredIngredients[k].name;

    if (!ingrePairing[cuisine1][ingreName] ||
      !ingrePairing[cuisine2][ingreName]) {
        continue;
    }

    var count1 = ingrePairing[cuisine1][ingreName][ingreName];
    var count2 = ingrePairing[cuisine2][ingreName][ingreName];

    var percent1 = count1 / totalDishesCuisine1;
    var percent2 = count2 / totalDishesCuisine2;

    var score = 0;

    // score = (1 - Math.abs(percent1 - percent2)) * Math.min(percent1, percent2);
    // if(score >= Math.min(percent1, percent2)) {
    //   score = Math.min(percent1, percent2);
    // }


    // if (Math.abs(percent1 - percent2) < 0.01 && percent1 > 0.1) {
    //   score = 1 / totalIngre;
    // } else if (Math.abs(percent1 - percent2) < 0.05 && percent1 > 0.1) {
    //   score = 0.1 / totalIngre;
    // }
    // score *= percent1;

    // score = percent1 * percent2 / totalIngre;

    // if (percent1 < percent2) {
    //   score = percent1 / percent2 / totalIngre;
    // } else {
    //   score = percent2 / percent1 / totalIngre;
    // }

    score = (percent1 - percent2) * (percent1 - percent2);

    similarity += score;
  }

  similarity = 1 / Math.pow(similarity, 0.5)
  // console.log(similarity);
  return similarity;
}

function cuisineTotalDishes(cuisineName) {
  for (var i = 0; i < nestedCuisines.length; i++) {
    for (var j = 0; j < nestedCuisines[i].values.length; j++) {
      if (cuisineName == nestedCuisines[i].values[j].key) {
        return dishesPerCuisine = nestedCuisines[i].values[j].values.length;
      }// how many dishes each cuisine
    }
  }
}

function cuisineTotalIngreConsiderRepeat(cuisineName) {
  var count = 0;
  for (var i = 0; i < filteredData.length; i++) {
    if (filteredData[i].cuisine === cuisineName) {
      count += filteredData[i].ingredients.length;
    }
  }
  return count;
}

function renderIngreCuisineMatrixPlot() {
  plot1.selectAll(".cellg")
    .data(ingreCuisinePairing)
    .enter()
    .append("rect")
    .attr('class','cellg')
    .attr('transform','translate(150,0)')
    .attr("x", function(d,i) {
      // console.log(d);
      var colId = Math.floor(i/row_number); //d.ingredient.index = d.id
      return colId * cellSize;
    })
    .attr("y", function(d,i) {
      var rowId = i % row_number;
      return rowId * cellSize;
    })
    // .attr("class", function(d){return "cell cell-border cr"+(d.row-1)+" cc"+(d.col-1);})
    .attr("width", cellSize *0.9)
    .attr("height",cellSize *0.9)
    .style("fill", function(d) {
      var dishesPerCuisine = cuisineTotalDishes(d.cuisine)
      return scaleColorMatrix(d.count/dishesPerCuisine);
    })
    .on('mouseenter',function(d,i){
      console.log(d);
      var tooltip = d3.select('.custom-tooltip');

      // console.log(Object.keys(list).length);
      tooltip.selectAll('.title')
        .html('<b>Cuisine:</b> ' + d.cuisine + '</br>' +
              '<b>Ingredient:</b> ' +d.ingredient.name + '</br>');
              // '<b>Most popular paired ingredient:</b> ' + keysSorted[0][0]);
      tooltip.transition().style('opacity',1);
      plot1.selectAll('.cellg')
        .style('opacity', 0.1);

      d3.select(this)
        .style('opacity', 1);
      plot1.selectAll('.cellg').filter(function(e,j){
        // console.log(this,e,j);
        var colId = Math.floor(i/row_number);
        var rowId = i%row_number;
        var cellColId = Math.floor(j/row_number);
        var cellRowId = j%row_number;

        return colId == cellColId || rowId == cellRowId;
        // console.log(colId,rowId);
      }).style('opacity',1);

      renderIngreCooccurancePlot(d)
    })
    .on('mousemove',function(d){
         var tooltip = d3.select('.custom-tooltip');
         var xy = d3.mouse(d3.select('.container').node());
         tooltip
            .style('left',xy[0]+10+'px')
            .style('top',xy[1]+10+'px');
    })
    .on('mouseleave',function(d){
         var tooltip = d3.select('.custom-tooltip');
         tooltip.transition().style('opacity',0);

         plot1.selectAll('.rowLabelg')
           .style('opacity', 1);
         plot1.selectAll('.colLabelg')
           .style('opacity', 1);
         plot1.selectAll('.cellg')
           .style('opacity', 1);
    })
    .on('click',function(d,i){
      console.log(this);
      console.log(d);
      console.log(i);
    });

    plot1.append('g').selectAll('.rowLabelg')
      // .data(Object.keys(allIngredients))
      .data(filteredIngredients)
      .enter()
      .append('text')
      .attr('class','rowLabelg')
      .text(function(d){
        var ingredientName = d.name;
        ingredientName = ingredientName.replace(/_/g, ' ');
        return ingredientName;})
      .style("text-anchor", "left")
      .attr('x', 0)
      .attr('y', function(d,i){return i * cellSize + 20;})
      // .attr("transform", "translate(-6," + cellSize / 1.5 + ")")
      .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
      .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);});

    plot1.append('g').selectAll('.colLabelg')
      .data(sortedCuisines)
      // .data(filteredCuisines)
      .enter()
      .append('text')
      .attr('class','colLabelg')
      .text(function(d){
        d = d.replace(/_/g, ' ');
        return d;})
      // .style("text-anchor", "right")
      .attr('x', 15)
      .attr('y', function(d,i){return i * cellSize +20;})
      // .attr("transform", "translate(-6," + cellSize /2 + ")")
      .attr("transform", "translate("+cellSize * 5.2+ ",-6) rotate (-90)")
      .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
      .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);});

    // renderCuisineGroupInfo();
}

function renderCuisineSimilarityMatrixPlot(){

  var cuisineMatrixPlotColCount = filteredCuisines.length;
  plot3.selectAll('.similarityCellg')
    .data(cuisineSimilarityMatrix)
    .enter()
    .append("rect")
    .attr('class','similarityCellg')
    .attr('transform','translate(250,0)')
    .attr("x", function(d,i) {
      // var colId = i % col_number;
      var colId = Math.floor(i/cuisineMatrixPlotColCount); //d.ingredient.index = d.id
      return colId * cellSize;
    })
    .attr("y", function(d,i) {
      // console.log(col_number);
      var rowId = i % cuisineMatrixPlotColCount;
      return rowId * cellSize;
    })
    .attr("width", cellSize *0.9)
    .attr("height",cellSize *0.9)
    .style("fill", function(d) {
      return scaleColorCuisineMatrix(d);
    })
    .on('click',function(d,i){
      // console.log(d);
      // console.log(i);
      var colId = Math.floor(i/cuisineMatrixPlotColCount);
      var rowId = i % cuisineMatrixPlotColCount;

      console.log("similarity: ", d);
      // console.log(sortedCuisines[rowId], sortedCuisines[colId]);
      renderBarPlotText();
      renderIngreUsageBarPlot(sortedCuisines[rowId], sortedCuisines[colId]);
    });

    plot3.append('g').selectAll('.rowLabelg')
      .data(sortedCuisines)
      .enter()
      .append('text')
      .attr('class','rowLabelg')
      .text(function(d){
        d = d.replace(/_/g, ' ');
        return d;})
      .style("text-anchor", "left")
      .attr('x', 0)
      .attr('y', function(d,i){return i * cellSize  + 20;})
      // .attr("transform", "translate(-6," + cellSize / 1.5 + ")")
      .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
      .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);});

    plot3.append('g').selectAll('.colLabelg')
      .data(sortedCuisines)
      // .data(filteredCuisines)
      .enter()
      .append('text')
      .attr('class','colLabelg')
      .text(function(d){
        d = d.replace(/_/g, ' ');
        return d;})
      .attr('x', 20)
      .attr('y', function(d,i){return i * cellSize +120;})
      // .attr("transform", "translate(-6," + cellSize /2 + ")")
      .attr("transform", "translate("+cellSize * 5.2+ ",-6) rotate (-90)")
      .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
      .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);});

}

function renderIngreUsageBarPlot(cuisineA, cuisineB){
  var ingreArrofA = [], ingreArrofB = [];
  var totoalDishesOfA = cuisineTotalDishes(cuisineA);
  var totoalDishesOfB = cuisineTotalDishes(cuisineB);

  // console.log(cuisineTotalDishes(cuisineA));
  for (var i = 0; i < filteredIngredients.length; i++) {
    var ingreName = filteredIngredients[i].name;
    if ( !ingrePairing[cuisineA][ingreName]) {
      ingreArrofA.push(0);
    } else {
      ingreArrofA.push(ingrePairing[cuisineA][ingreName][ingreName]/totoalDishesOfA);
    }
  }

  for (var i = 0; i < filteredIngredients.length; i++) {
    var ingreName = filteredIngredients[i].name;
    if ( !ingrePairing[cuisineB][ingreName]) {
      ingreArrofB.push(0);
    } else {
      ingreArrofB.push(ingrePairing[cuisineB][ingreName][ingreName]/totoalDishesOfB);
    }
  }
  //
  // console.log(ingreArrofA);
  // console.log(ingreArrofB);
  // console.log(ingrePairing);

  //Draw cuisineA - ingreArrofA bar chart
  var ingredientBars = plot4.selectAll('.ingredientUsageBarA')
    .data(ingreArrofA);
  //Enter
  var ingredientBarsEnter = ingredientBars.enter()
    .append('rect');
  //Update
  ingredientBars.merge(ingredientBarsEnter)
    .attr('class','ingredientUsageBarA')
    // .attr('transform','translate()')
    .attr('transform', function(d, i) {
      return 'translate(0,'+i * cellSize+')';
    })
    .attr('x', w/4 + 2)
    .transition()
    // .duration(5000)
    .attr('width', function(d){return d*170;})
    // .attr('y',function(d,i){
    //   return i * cellSize;
    // })
    .attr('height',15)
    .style('fill', 'rgb(125, 185, 118)'); // green

  //Exit
  ingredientBars.exit()
    .remove();

  //Draw cuisineB - ingreArrofB bar chart
  var ingredientBars = plot4.selectAll('.ingredientUsageBarB')
    .data(ingreArrofB);
  //Enter
  var ingredientBarsEnter = ingredientBars.enter()
    .append('rect')
    .attr('x',w/4);
  //Update
  ingredientBars.merge(ingredientBarsEnter)
    .attr('class','ingredientUsageBarB')
    .attr('transform', function(d, i) {
      return 'translate(0,'+i * cellSize+')';
    })
    .transition()
    .attr('x', function(d){return (w/4 - d*170);})
    .attr('width', function(d){return d*170;})
    // .attr('y',function(d,i){
    //   return i * cellSize;
    // })
    .attr('height',15)
    .style('fill', 'rgb(125, 185, 118)');

  //Exit
  ingredientBars.exit()
    .remove();

  //Label for plot4
  // var barLabelGroup = plot4.select('.barLabelGroup');
  // var barLabel = barLabelGroup.selectAll('.barLabelg')
  //   .data(filteredIngredients, function(d) {return d.name;});
  //
  // //Enter
  // var barLabelEnter =  barLabel.enter()
  //   .append('text');
  //
  // //Update
  // barLabel.merge(barLabelEnter)
  //   .attr('class','barLabelg')
  //   .text(function(d){
  //     var ingredientName = d.name;
  //     ingredientName = ingredientName.replace(/_/g, ' ');
  //     return ingredientName;})
  //   .style("text-anchor", "left")
  //   .attr('x', 30)
  //   .attr('y', function(d,i){return i * cellSize;});
  //
  // //Exit
  // barLabel.exit()
  //   .remove();

  //Append cuisine label
  $('.cuisineABLabel').css('opacity',1);
  $('#cuisineA').text(cuisineB.replace(/_/g, ' '));
  $('#cuisineB').text(cuisineA.replace(/_/g, ' '));

  // plot4.append('text')
  //   .text(function(d){
  //     return cuisineA.replace(/_/g, ' ');
  //   })
  //   .attr('x', w/4 + 10)
  //   .attr('y', -10);
  //
  // plot4.append('text')
  //   .text(function(d){
  //     return cuisineB.replace(/_/g, ' ');
  //   })
  //   .attr('x', w/4-50)
  //   .attr('y', -10);
}

function renderBarPlotText() {
  // Label for plot4
  var barLabel = plot4.selectAll('.barLabelg')
    .data(filteredIngredients);
  //Enter
  var barLabelEnter =  barLabel.enter()
    .append('text');
  //Update
  barLabel.merge(barLabelEnter)
    .attr('class','barLabelg')
    .text(function(d){
      var ingredientName = d.name;
      ingredientName = ingredientName.replace(/_/g, ' ');
      return ingredientName;
    })
    .style("text-anchor", "right")
    .attr('x', 0)
    .attr('y', function(d,i){return i * cellSize +15;});

  //Exit
  barLabel.exit()
    .remove();
}

function renderIngreCooccurancePlot(ingreCuisinePair) {

  var d = ingreCuisinePair;

  var list = ingrePairing[d.cuisine][d.ingredient.name];
  keysSorted = Object.entries(list).sort(function(a,b){return b[1]-a[1]});
  ingredientSelf = keysSorted.shift();

  $('.prompt').html('What food ingredient goes well with');
  $('.selectedIngredient').html(d.ingredient.name.replace(/_/g, ' ') );
  $('.selectedCuisine').html(' in ' + d.cuisine.replace(/_/g, ' ') + ' cuisine');

  var top15Paired = [];
  top15Paired.push(keysSorted[1],keysSorted[2],keysSorted[3],keysSorted[4],
    keysSorted[5],keysSorted[6],keysSorted[7],keysSorted[8],keysSorted[9],
    keysSorted[10],keysSorted[11],keysSorted[12],keysSorted[13],keysSorted[14],
    keysSorted[15],keysSorted[16],keysSorted[17],keysSorted[18],keysSorted[19],
    keysSorted[20]);

  var rectIngredient = plot2.selectAll('g')
    .data(top15Paired,function(d){ // keysSorted
      // console.log(keysSorted);
      return d[0];
    });

  rectIngredient.exit()
    .transition()
    .duration(10000)
    .attr('transform',function(d,i){
      return 'translate(2000, 30000)';
    })
    .remove();

  //ENTER
  var rectIngredientEnter = rectIngredient.enter()
    .append('g')
    .attr('class','rect')
    .attr('transform',function(d,i){
      return 'translate(0,'+scaleYIngredient(i) * 1.2+')';
    });

  var currentIngredient = d.ingredient.name;

  rectIngredientEnter.append('rect')
    .attr('x',0)
    .attr('width',rectIngredientWidth)
    .attr('height',rectIngredientHeight)
    .style('fill',function(d){
      return scaleColorPlot2(d[1]/list[currentIngredient]);
    });

  rectIngredientEnter.append('text')
    .attr('class', 'ingredientLabel')
    .attr('x', rectIngredientWidth *2)
    .attr('y', rectIngredientWidth/2+5)
    .text(function(d){
      // return d[0][0];
      return d[0].replace(/_/g, ' ');
    }) // d[0] show the name of ingredient
    .style('fill', '#3e3e3e');

  var rectIngridientTransit = rectIngredientEnter
    .merge(rectIngredient)
    .transition()
    .attr('transform', function(d, i) {
      return 'translate(0,'+scaleYIngredient(i) * 1.2+')';
    });

  rectIngridientTransit.select('rect')
    .transition()
    .style('fill',function(d){
      return scaleColorPlot2(d[1]/list[currentIngredient]);
    });

  rectIngridientTransit.select('text')
    .transition()
    .text(function(d){return d[0].replace(/_/g, ' ');}); //show text in plot2
}

function renderCuisineGroupInfo() {
  //Legend of Asian
  plot1.append('line')
    .attr('x1', 150)
    .attr('y1', -220)
    .attr('x2', 150)
    .attr('y2', -210)
    .attr('stroke-width', 1)
    .attr('stroke', '#8c8c8c');

  plot1.append('line')
    .attr('x1', cellSize *7 + 140)
    .attr('y1', -220)
    .attr('x2', cellSize *7 + 140)
    .attr('y2', -210)
    .attr('stroke-width', 1)
    .attr('stroke', '#8c8c8c');

  plot1.append('line')
    .attr('x1', 150)
    .attr('y1', -220)
    .attr('x2', cellSize *7 + 140)
    .attr('y2', -220)
    .attr('stroke-width', 1)
    .attr('stroke', '#8c8c8c');

  plot1.append('text')
    .text('Asian')
    .attr('x',140 + cellSize *7/2  )
    .attr('y',-230);

  //Legend of European
  plot1.append('line')
    .attr('x1', cellSize *7 + 150)
    .attr('y1', -220)
    .attr('x2', cellSize *7 + 150)
    .attr('y2', -210)
    .attr('stroke-width', 1)
    .attr('stroke', '#8c8c8c');

  plot1.append('line')
    .attr('x1', cellSize *18 + 150)
    .attr('y1', -220)
    .attr('x2', cellSize *18 + 150)
    .attr('y2', -210)
    .attr('stroke-width', 1)
    .attr('stroke', '#8c8c8c');

  plot1.append('line')
    .attr('x1', cellSize *7 + 150)
    .attr('y1', -220)
    .attr('x2', cellSize *18 + 150)
    .attr('y2', -220)
    .attr('stroke-width', 1)
    .attr('stroke', '#8c8c8c');

  plot1.append('text')
    .text('European')
    .attr('x', cellSize *7 + cellSize *18/2  )
    .attr('y',-230);

  //Legend of American
  plot1.append('line')
    .attr('x1', cellSize *18 + 160)
    .attr('y1', -220)
    .attr('x2', cellSize *18 + 160)
    .attr('y2', -210)
    .attr('stroke-width', 1)
    .attr('stroke', '#8c8c8c');

  plot1.append('line')
    .attr('x1', cellSize *24 + 150)
    .attr('y1', -220)
    .attr('x2', cellSize *24 + 150)
    .attr('y2', -210)
    .attr('stroke-width', 1)
    .attr('stroke', '#8c8c8c');

  plot1.append('line')
    .attr('x1', cellSize *18 + 160)
    .attr('y1', -220)
    .attr('x2', cellSize *24 + 150)
    .attr('y2', -220)
    .attr('stroke-width', 1)
    .attr('stroke', '#8c8c8c');

  plot1.append('text')
    .text('American')
    .attr('x', 30+ cellSize *24)
    .attr('y',-230);

  //Legend of Affircan
  plot1.append('line')
    .attr('x1', cellSize *24 + 160)
    .attr('y1', -220)
    .attr('x2', cellSize *24 + 160)
    .attr('y2', -210)
    .attr('stroke-width', 1)
    .attr('stroke', '#8c8c8c');

  plot1.append('line')
    .attr('x1', cellSize *26 + 150)
    .attr('y1', -220)
    .attr('x2', cellSize *26 + 150)
    .attr('y2', -210)
    .attr('stroke-width', 1)
    .attr('stroke', '#8c8c8c');

  plot1.append('line')
    .attr('x1', cellSize *24 + 160)
    .attr('y1', -220)
    .attr('x2', cellSize *26 + 150)
    .attr('y2', -220)
    .attr('stroke-width', 1)
    .attr('stroke', '#8c8c8c');

  plot1.append('text')
    .text('African')
    .attr('x', 100 + cellSize *26)
    .attr('y',-230);
}

function drawLegend(){
  var legendContainer = d3.select('.key').append('svg')
    .attr('wdith', w)
    .attr('height', 50);

  var key = d3.select(".key")
    .append("svg")
    .attr("width", 500)
    .attr("height", cellSize*2);

  var legend = key.append("defs")
    .append("svg:linearGradient")
    .attr("id", "gradient");

  legend.append("stop")
    .attr('class', 'stop-left')
  	.attr("offset", "0%");

  legend.append("stop")
    .attr('class', 'stop-right')
  	.attr("offset", "100%");

  key.append("rect")
    .classed('filled', true)
    .attr("width", 400)
    .attr("height", cellSize);

  var cuisinIngreKeyLeft = key.append('text')
    .attr('class', 'keyLeftText')
    .text('Low usage')
    .attr('x', 0)
    .attr('y', 50);

  var cuisinIngreKeyRight = key.append('text')
    .attr('class', 'keyRightText')
    .text('High usage')
    .attr('x', 350)
    .attr('y', 50);
}

function draw() {
  renderIngreCuisineMatrixPlot();
  renderCuisineSimilarityMatrixPlot();
  drawLegend();
}

$('.cuisineSimilarityBtn').click(function(){
  $('.cuisineSimilarityContainer').css({
    opacity: '1',
    position: 'absolute',
    top: '1%'
  });
  $('.cuisineIngreContainer').css('opacity',0);
  // $('.cuisineSimilarityContainer').css('opacity',1);
  $('.keyLeftText').text('Low similarity');
  $('.keyRightText').text('High similarity');
});

$('.cuisineIngreBtn').click(function(){
  $('.cuisineSimilarityContainer').css({
    opacity: '0',
    position: 'relative',
    top: '65%'
  });
  $('.cuisineIngreContainer').css('opacity',1);
  $('.cuisineSimilarityContainer').css('opacity',0);
  $('.keyLeftText').text('Low usage');
  $('.keyRightText').text('High usage');
});

function parse(d){
  var entry = {
    region: d.Region,
    cuisine: d.Cuisine,
    ingredients: []
  };
  for (var i = 0; i < 30; i++) {
    let ingredient = d['Ingredient' + i];

    if (ingredient === undefined || ingredient === '') {
      continue;
    }

    entry.ingredients.push(ingredient);

    if (ingredient in allIngredients) {
      allIngredients[ingredient].count ++;
    } else {
      allIngredients[ingredient] = {name:ingredient, count:1, index: Object.keys(allIngredients).length};
    }

    if (allCuisines.includes(entry.cuisine)) {
      continue;
    } else {
      allCuisines.push(entry.cuisine);
    }

  }
  return entry;
}
