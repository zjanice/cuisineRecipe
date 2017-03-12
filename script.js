console.log('Cuisine Recipe project');

var m = {t:50,r:50,b:50,l:50},
w = document.getElementById('plot1').clientWidth - m.l - m.r,
h = document.getElementById('plot1').clientHeight - m.t - m.b;
// w = document.getElementById('canvas').clientWidth,
// h = document.getElementById('canvas').clientHeight;
var pairedData = [];

var allIngredients = {};
var allCuisines = [];
var sortedCuisines = ['Japanese', 'Chinese', 'Asian', 'Vietnamese', 'Thai' ,'Indian', 'MiddleEastern',
    'EasternEuropean_Russian', 'Jewish', 'Greek', 'Mediterranean', 'French',  'Italian','Spanish_Portuguese', 'German', 'English_Scottish', 'Irish', 'Scandinavian',
    'American', 'Cajun_Creole', 'Central_SouthAmerican', 'Mexican', 'Southern_SoulFood', 'Southwestern',
    'African', 'Moroccan'];

var rectIngredientWidth = 5, rectIngredientHeight = 5;
var rectCuisineWidth = 5, rectCuisineHeight = 3;

var cellSize = 32, col_number= 26, row_number= 350;

var plots = d3.selectAll('.plot')
	.append('svg')
	.attr('width', w + m.l + m.r)
	.attr('height', h + m.t + m.b)
	.append('g')
	.attr('class','canvas')
	.attr('transform','translate('+m.l+','+m.t+')');

var plot1 = plots.filter(function(d,i){ return i===0;}),
    plot2 = plots.filter(function(d,i){ return i===1;});

var scaleXCuisine = d3.scaleLinear()
  .domain([0,3])
  .range([0,w]);

var scaleXIngredient = d3.scaleLinear()
  .domain([0,62])
  .range([0,w]);

var scaleLineWidth = d3.scaleLinear()
  .domain([0,1000])
  .range([0,10]);

var scaleColor = d3.scaleOrdinal()
  .range(['#fd6b5a','#03afeb','orange']);
var scaleColorMatrix = d3.scaleLinear()
  .domain([0,0.82])
  .range(["white","#4169e1"]);
var colorScale20c = d3.scaleOrdinal().range(d3.schemeCategory20c);

var scaleOpacity = d3.scaleLinear()
  .domain([0,2000])
  .range([0,1]);

//---------------------------- Chord Variables ---------------------------------
var outerRadius = Math.min(w, h) / 2  - 100,
  innerRadius = outerRadius * 0.95,
	opacityDefault = 0.7; //default opacity of chords
//
var matrix = [];

var chord = d3.chord()
  .padAngle(0.05)
  .sortSubgroups(d3.descending);//sort the chords inside an arc from high to low
	// .sortChords(d3.descending) //which chord should be shown on top when chords cross. Now the biggest chord is at the bottom
	// .matrix(matrix);

var arc = d3.arc()
	.innerRadius(innerRadius)
	.outerRadius(outerRadius);

var ribbon = d3.ribbon()
    .radius(innerRadius);

// var path = d3.chord()
// 	.radius(innerRadius);

d3.queue()
  .defer(d3.csv,'data/modifiedrecipe.csv',parse)
  .await(dataloaded);

function dataloaded(err, data){
  // console.log(data);
  var datasets = data;
  // console.log(allIngredients); // 350 ingredients in total
  // console.log(data.length); //13408 rows of record
  draw(data);
  // console.log(allCuisines); // 26 cuisines
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

function prepareMatrix(data){
  console.log(data);
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
  return matrix;
}

function prepareIngrePairing(data,filteredIngredients) {
  var ingrePairing = {};
  for (var i = 0; i < sortedCuisines.length; i++) {
    ingrePairing[sortedCuisines[i]] = prepareMatrix(data.filter(function(d){
      return d.cuisine === sortedCuisines[i];
    }));
  }
  console.log(ingrePairing);
  return ingrePairing;


  // for (var i = 0; i < sortedCuisines.length; i++) {
  //   for (var j = 0; j < filteredIngredients.length; j++) {
  //     matrix.push([]);
  //     for (var k = 0; k < filteredIngredients.length; k++) {
  //       matrix[i].push(0);
  //
  //     }
  //   }
  // console.log(matrix[i]); // 26 matrix with all zero
  // }
  //
  // // -------------------Find all ingredients combination------------------------
  // for (var i = 0; i < data.length; i++) {
  //   for (var j = 0; j < data[i].ingredients.length; j++) {
  //     for (var k = j+1; k < data[i].ingredients.length; k++) {
  //         // console.log(data[i].ingredients[j] + ' * ' + data[i].ingredients[k]);
  //         var index1 = -1, index2 = -1;
  //         index1 = getIngredientIndex(filteredIngredients, data[i].ingredients[j]);
  //         index2 = getIngredientIndex(filteredIngredients, data[i].ingredients[k]);
  //         if (index1 == -1 || index2 == -1) {
  //           continue;  // if ingredients found not in filteredIngredients scope, then continue;
  //         }
  //         matrix[index1][index2] ++;
  //         matrix[index2][index1] ++;
  //     }
  //   }
  // }
  // row_number = filteredIngredients.length;
  // console.log(matrix);
  // console.log(filteredIngredients.indexOf(data[0].ingredients[2]));
}


function draw(data) {
  //-----------------------------Filter Data------------------------------------
  var filteredCuisines = allCuisines.filter(function(d){
    return true;
  });

  var filteredData = data.filter(function(d){
    return true;
  });

  var nestedCuisines = d3.nest()
    .key(function(d) {return d.region;})
    .key(function(d) {return d.cuisine;})
    .entries(data);

  for (var i = 0; i < nestedCuisines.length; i++) {
    for (var j = 0; j < nestedCuisines[i].values.length; j++) {
      // console.log(nestedCuisines[i].values[j].key, nestedCuisines[i].values[j].values.length); // how many dishes each cuisine
    }
  }
  // console.log(nestedCuisines);
  // console.log(Object.values(nestedCuisines[0]));
  // console.log(nestedCuisines[0].values); // cuisine name

  var filteredIngredients = Object.values(allIngredients);
  filteredIngredients = filteredIngredients.filter(function(d){
    return d.count > 3000; //1000
  });
  row_number = filteredIngredients.length;

  for (var i = 0; i < filteredIngredients.length; i++) {
    filteredIngredients[i].index = i ;
  }

  sortedFilteredIngredients = filteredIngredients.sort(function (a, b) {
    return b.count - a.count;
  });
  // console.log(nestedSortedFilteredIngredients);

  scaleXIngredient.domain([0, filteredIngredients.length]);
  prepareIngrePairing(data,filteredIngredients);
  // console.log(filteredIngredients); //(array of object with name, count. index);
  console.log('filteredIngredients: '+filteredIngredients.length); //84

  for (var i = 0; i < sortedCuisines.length; i++) {
    // filteredCuisines[i]
    for (var j = 0; j < filteredIngredients.length; j++) {
      var element = {};
      element.cuisine = sortedCuisines[i];
      element.count = 0;
      element.ingredient = filteredIngredients[j];
      pairedData.push(element);
    }
  }

  for (var i = 0; i < data.length ; i++) {
    for (var j = 0; j < data[i].ingredients.length; j++) {
      for (var k = 0; k < pairedData.length; k++) { //find element by cuisine & ingredients
        if (data[i].ingredients[j] == pairedData[k].ingredient.name &&
            data[i].cuisine == pairedData[k].cuisine) { // find the index (with object)
          pairedData[k].count ++;
          break;
        }
      }
    }
  }
  console.log(pairedData);

  //-----------------------------draw matrix chart -----------------------------
  plot1.selectAll(".cellg")
    .data(pairedData)
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
      var rowId = i%row_number;
      return rowId * cellSize;
    })
    // .attr("class", function(d){return "cell cell-border cr"+(d.row-1)+" cc"+(d.col-1);})
    .attr("width", cellSize *0.75)
    .attr("height",cellSize *0.75)
    .style("fill", function(d) {
      for (var i = 0; i < nestedCuisines.length; i++) {
        for (var j = 0; j < nestedCuisines[i].values.length; j++) {
          if (d.cuisine == nestedCuisines[i].values[j].key) {
            var dishesPerCuisine = nestedCuisines[i].values[j].values.length;
          }// how many dishes each cuisine
        }
      }
      return scaleColorMatrix(d.count/dishesPerCuisine);
    })
    .on('mouseenter',function(d,i){
      // console.log(i);
      var tooltip = d3.select('.custom-tooltip');
      tooltip.selectAll('.value')
        .html('hi');
      tooltip.transition().style('opacity',1);
      plot1.selectAll('.cellg')
        .style('opacity', 0.1);

      d3.select(this)
        .style('opacity', 1);
      plot1.selectAll('.cellg').filter(function(e,j){
        // console.log(this);
        var colId = Math.floor(i/row_number);
        var rowId = i%row_number;
        var cellColId = Math.floor(j/row_number);
        var cellRowId = j%row_number;

        return colId == cellColId || rowId == cellRowId;
        // console.log(colId,rowId);
      }).style('opacity',1);
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
      .text(function(d){return d.name;})
      .style("text-anchor", "left")
      .attr('x', 0)
      .attr('y', function(d,i){return i * cellSize  + 20;})
      // .attr("transform", "translate(-6," + cellSize / 1.5 + ")")
      .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
      .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);});

    plot1.append('g').selectAll('.colLabelg')
      .data(sortedCuisines)
      // .data(filteredCuisines)
      .enter()
      .append('text')
      .attr('class','colLabelg')
      .text(function(d){return d;})
      // .style("text-anchor", "right")
      .attr('x', 0)
      .attr('y', function(d,i){return i * cellSize;})
      // .attr("transform", "translate(-6," + cellSize /2 + ")")
      .attr("transform", "translate("+cellSize * 5.2+ ",-6) rotate (-90)")
      .on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
      .on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);});
} // end of function draw

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
