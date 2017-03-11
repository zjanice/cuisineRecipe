console.log('Cuisine Recipe project');

var m = {t:50,r:50,b:50,l:50},
w = document.getElementById('plot1').clientWidth - m.l - m.r,
h = document.getElementById('plot1').clientHeight - m.t - m.b;
// w = document.getElementById('canvas').clientWidth,
// h = document.getElementById('canvas').clientHeight;
var pairedData = [];

var allIngredients = {};
var allCuisines = [];
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
    plot2 = plots.filter(function(d,i){ return i===1;}),
    plot3 = plots.filter(function(d,i){ return i===2;});

// var plot = d3.select('.canvas')
//   .append('svg')
//   .attr('width', w + m.l + m.r)
//   .attr('height', 1.1*h + m.t + m.b)
//   .append('g')
//   .attr('transform','translate('+ m.l+','+ m.t+')');

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
  for (var i = 0; i < filteredIngredients.length; i++) {
    if (ingredientName == filteredIngredients[i].name) {
      index = filteredIngredients[i].index; // find the index (with object)
      return index;
    }
  }
  return -1; // if not found
}

function prepareMatrix(data,filteredIngredients) {
  for (var i = 0; i < filteredIngredients.length; i++) {
    matrix.push([]);
    for (var j = 0; j < filteredIngredients.length; j++) {
      matrix[i].push(0);
    }
  }

  // -------------------Find all ingredients combination------------------------
  for (var i = 0; i < data.length; i++) {
    for (var j = 0; j < data[i].ingredients.length; j++) {
      for (var k = j+1; k < data[i].ingredients.length; k++) {
          // console.log(data[i].ingredients[j] + ' * ' + data[i].ingredients[k]);
          var index1 = -1, index2 = -1;
          index1 = getIngredientIndex(filteredIngredients, data[i].ingredients[j]);
          index2 = getIngredientIndex(filteredIngredients, data[i].ingredients[k]);
          if (index1 == -1 || index2 == -1) {
            continue;  // if ingredients found not in filteredIngredients scope, then continue;
          }
          matrix[index1][index2] ++;
          matrix[index2][index1] ++;
      }
    }
  }
  row_number = filteredIngredients.length;
  // console.log(filteredIngredients);
  // console.log(filteredIngredients.indexOf(data[0].ingredients[2]));
}


function draw(data) {
  //-----------------------------Filter Data------------------------------------
  var filteredCuisines = allCuisines.filter(function(d){
    // return d == 'Asian' || d == 'Thai' || d == 'Vietnamese' || d == 'Indian'||
    //        d == 'MiddleEastern' || d == 'Chinese' || d == 'Japanese' ||  //Aisan
    //
    //        d == 'Italian'|| d == 'Spanish_Portuguese'|| d == 'Jewish' || d == 'French'||
    //        d == 'Scandinavian' || d == 'Greek'|| d == 'Spanish_Portuguese'|| d == 'Jewish' ||
    //        d == 'French'|| d == 'Scandinavian' || d == 'EasternEuropean_Russian' ||
    //        d == 'Irish' ||  d ==' German' || d == 'Mediterranean' || d == 'English_Scottish' ||//European
    //
    //        d == 'American'|| d == 'Cajun_Creole' || d == 'Central_SouthAmerican' ||
    //        d == 'Mexican' || d == 'Southern_SoulFood' || d =='Southwestern' || //American
    //
    //        d == 'African'|| d == 'Moroccan';  //African

    return true;
  });

  // console.log('filteredCuisines: '+filteredCuisines);
  var filteredData = data.filter(function(d){
    return true;
    // return d == 'Asian' || d == 'Thai' || d == 'Vietnamese' || d == 'Indian'||
    //        d == 'MiddleEastern' || d == 'Chinese' || d == 'Japanese' ||  //Aisan
    //
    //        d == 'Italian'|| d == 'Spanish_Portuguese'|| d == 'Jewish' || d == 'French'||
    //        d == 'Scandinavian' || d == 'Greek'|| d == 'Spanish_Portuguese'|| d == 'Jewish' ||
    //        d == 'French'|| d == 'Scandinavian' || d == 'EasternEuropean_Russian' ||
    //        d == 'Irish' ||  d ==' German' || d == 'Mediterranean' || d == 'English_Scottish' ||//European
    //
    //        d == 'American'|| d == 'Cajun_Creole' || d == 'Central_SouthAmerican' ||
    //        d == 'Mexican' || d == 'Southern_SoulFood' || d =='Southwestern' || //American

          //  d == 'African'|| d == 'Moroccan';  //African
  });
  // console.log('filteredData: '+filteredData.length); // 136

  var nestedCuisines = d3.nest()
    .key(function(d) {return d.region; })
    .key(function(d) {return d.cuisine;})
    .entries(data);

  for (var i = 0; i < nestedCuisines.length; i++) {
    for (var j = 0; j < nestedCuisines[i].values.length; j++) {
      console.log(nestedCuisines[i].values[j].key, nestedCuisines[i].values[j].values.length); // how many dishes each cuisine
    }
  }
  console.log(nestedCuisines);
  // console.log(Object.values(nestedCuisines[0]));
  // console.log(nestedCuisines[0].values); // cuisine name

  var filteredIngredients = Object.values(allIngredients);
  filteredIngredients = filteredIngredients.filter(function(d){
    return d.count > 10; //1000
  });

  for (var i = 0; i < filteredIngredients.length; i++) {
    filteredIngredients[i].index = i ;
  }

  sortedFilteredIngredients = filteredIngredients.sort(function (a, b) {
    return b.count - a.count;
  });

  // console.log(sortedFilteredIngredients);

  scaleXIngredient.domain([0, filteredIngredients.length]);
  prepareMatrix(data,filteredIngredients);
  // console.log(filteredIngredients); //(array of object with name, count. index);
  console.log('filteredIngredients: '+filteredIngredients.length); //84

  var sortedCuisines = ['Japanese', 'Chinese', 'Asian', 'Vietnamese', 'Thai' ,'Indian', 'MiddleEastern',
    'EasternEuropean_Russian', 'Jewish', 'Greek', 'Mediterranean', 'French',  'Italian','Spanish_Portuguese', 'German', 'English_Scottish', 'Irish', 'Scandinavian',
    'American', 'Cajun_Creole', 'Central_SouthAmerican', 'Mexican', 'Southern_SoulFood', 'Southwestern',
    'African', 'Moroccan']

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

//------------------------DRAW ingredients--------------------------------------
  var rectIngredient = plot1.selectAll('rect').data(filteredIngredients);

  //ENTER
  var rectIngredientEnter = rectIngredient
    .enter()
    .append('g')
    .attr('class','rectIngredient')
    .attr('transform',function(d,i){
      return 'translate('+scaleXIngredient(i)+',0)';
      // return 'translate('+ (rectIngredientWidth+5) * i+',0)';
    });

  rectIngredientEnter.append('rect')
    .attr('y',h/2)
    .attr('width',rectIngredientWidth)
    .attr('height',rectIngredientHeight);

  rectIngredientEnter.append('text')
    .attr('x',-h/2-rectIngredientWidth - 5)
    .attr('y', rectIngredientWidth/2+5)
    .text(function(d){return d.name;})
    .style('text-anchor', 'end')
    .attr("transform", "rotate(-90)")
    .style('fill','#4e4e4e')
    .on('mouseenter',function(d){
      var text = $(this).text();
      $('.line').css('opacity', 0);
      $('.' + text + 'Line').css('opacity', 1);
    })
    .on('mouseleave',function(d){
      $('.line').css('opacity',1);
     });

//---------------------------DRAW cuisine---------------------------------------
  var rectCuisine = plot1.selectAll('.rectCuisine').data(filteredCuisines);

  var rectCuisineEnter = rectCuisine
    .enter()
    .append('g')
    .attr('class','rectCuisine')
    .attr('transform',function(d,i){
      return 'translate('+scaleXCuisine(i)+',0)';
    });

  rectCuisineEnter.append('rect')
    .attr('y',h/4)
    .attr('width',rectCuisineWidth)
    .attr('height',rectCuisineHeight)
    .style('fill',function(d){return scaleColor(d.cuisine)})
    .on('click',function(d,i){
      // console.log(d); // clicked cuisine
      // console.log(i);//index of clicked rect
      // console.log(this);
    });

  rectCuisineEnter.append('text')
    .attr('transform','translate(30,'+h/5+')')
    // .attr('x',h/4)
    // .attr('y', h/4 -20)
    // .attr('y', rectCuisineHeight/2 + rectCuisineWidth/2)
    .text(function(d){return d;})
    .style('text-anchor', 'end')
    // .attr("transform", "rotate(-90)")
    .style('fill','black')
    .on('mouseenter',function(d){
      var text = $(this).text();
      $('.line').css('opacity', 0.1);
      $('.' + text + 'Line').css('opacity', 1);
    })
    .on('mouseleave',function(d){
      $('.line').css('opacity',1);
     });


  //---------------------------APPEND LINE--------------------------------------
  plot1.selectAll('.line')
    .data(pairedData)
    .enter()
    .append('g')
    .attr('class',function(d){ // append different classes to line & ingredient
      return 'line ' + d.cuisine + 'Line ' + d.ingredient.name + 'Line';

    })
    .append('line')
    .attr('x1', function(d,i){
      return scaleXCuisine(filteredCuisines.indexOf(d.cuisine));
    })
    .attr('y1', h/4)
    .attr('x2', function(d,i){
      return scaleXIngredient(d.ingredient.index);
    })
    .attr('y2', h/2)
    .attr('stroke-width',function(d){
      return scaleLineWidth(d.count);
    })
    .attr('stroke', function(d){return scaleColor(d.cuisine);})
    .on('mouseenter',function(d){
      // console.log(d);
    })
    .on('mouseleave',function(d){

     });
   //EXIT
   rectIngredient.exit().remove();

//---------------------------Button Group Switch View --------------------------
  d3.select('.cuisineIngredientIChartBtn')
    .on('click',function(){
      $('.chordChart').css('visibility','hidden');
      $('.ribbon').css('visibility','hidden');
      $('.line').css('visibility','visible');
      $('.rectCuisine').css('visibility','visible')
      $('.rectIngredient').css('visibility','visible');
    });

  d3.select('.chordChartBtn')
    .on('click',function(d){
      $('.line').css('visibility','hidden');
      $('.rectCuisine').css('visibility','hidden')
      $('.rectIngredient').css('visibility','hidden');

      // d3.selectAll('.rectIngredient')
      //   .transition()
      //   .attr('transform',function(d,i){
      //     return 'translate('+scaleXIngredient(i)+',-300)';
      //   });

//---------------------------Draw outer chords ---------------------------------
      var g = plot1.append('g')
        .attr('transform', 'translate('+ w / 2 + ',' + h / 2 + ')')
        .datum(chord(matrix));

      var group = g.append('g')
        .attr('class', 'chordChart groups')
        .selectAll('g')
        .data(function(chords) {
          console.log(chords);
          return chords.groups; })
        .enter().append('g');

      group.append('path')
        .style('fill', function(d){return colorScale20c(d.index)})
        .style('stroke', function(d) { return d3.rgb(colorScale20c(d.index)).darker(); })
        .attr('d', arc);

      group.append('text')
        .each(function(d) { d.angle = ((d.startAngle + d.endAngle) / 2);})
        .attr('dy', ".35em")
        .attr('class', "chordTitle")
        .attr('text-anchor', function(d) { return d.angle > Math.PI ? "end" : null; })
        .attr('transform', function(d,i) {
          var c = arc.centroid(d);
          return 'rotate(' + (d.angle * 180 / Math.PI - 90) + ')'
          + 'translate(' + (innerRadius + 55) + ')'
          + (d.angle > Math.PI ? "rotate(180)" : '')
        })
        .text(function(d,i) {return filteredIngredients[i].name; })
        .on('mouseenter',function(d){
          var text = $(this).text();
          $('.ribbon').css('opacity', function(index, value) {
            return value / 10;
          });
          $('.' + d.index + 'Ribbon').css('opacity', function(index, value) {
            return value * 100;
          });
        })
        .on('mouseleave',function(d){
          console.log(d);
          $('.ribbon').css('opacity', function(index, value){
            if ($(this).hasClass(d.index + 'Ribbon')) {
              return value / 10;
            } else {
              return value * 10;
            }
          });
        });

      g.append('g')
        .selectAll('path')
        .data(function(chords) {return chords; })
        .enter().append('path')
        .attr('class',function(d){ // append different classes to chords/ribbons
          return 'ribbon ' + d.source.index + 'Ribbon ' + d.target.index + 'Ribbon';
        })
        .attr('d', ribbon)
        .style('fill', function(d) {return colorScale20c(d.target.index); })
        .style('opacity',function(d){return scaleOpacity(d.target.value);})
        .style('stroke', function(d) {return d3.rgb(colorScale20c(d.target.index)).darker(); });


    });


  // rectIngredientEnter.on('mouseenter',function(d){
  //   console.log(d.name);
  //   var tooltip = d3.select('.custom-tooltip');
  //   tooltip.selectAll('.title')
  //       .html(d.name);
  //   // tooltip.select('.value')
  //   //     .html('$'+ d.price);
  //   tooltip.transition().style('opacity',1);
  //
  //   d3.select(this).style('stroke-width','3px');
  // })
  // .on('mousemove',function(d){
  //    var tooltip = d3.select('.custom-tooltip');
  //    var xy = d3.mouse(d3.select('.container').node());
  //    tooltip
  //       .style('left',xy[0]+10+'px')
  //       .style('top',xy[1]+10+'px');
  //     })
  // .on('mouseleave',function(d){
  //    var tooltip = d3.select('.custom-tooltip');
  //    tooltip.transition().style('opacity',0);
  //    d3.select(this).style('stroke-width','0px');
  //  });
  // console.log(allCuisines);

  //-----------------------------draw matrix chart -----------------------------
  plot3.selectAll(".cellg")
    .data(pairedData)
    // .data(pairedData,function(d){return d.row+":"+d.col;})
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
      // console.log(d);
      for (var i = 0; i < nestedCuisines.length; i++) {
        for (var j = 0; j < nestedCuisines[i].values.length; j++) {
          if (d.cuisine == nestedCuisines[i].values[j].key) {
            var dishesPerCuisine = nestedCuisines[i].values[j].values.length;
          }// how many dishes each cuisine
        }
      }
      // console.log(d.count/dishesPerCuisine);
      return scaleColorMatrix(d.count/dishesPerCuisine);
    })
    .on('mouseenter',function(d,i){
      // console.log(i);
      var tooltip = d3.select('.custom-tooltip');
      tooltip.selectAll('.value')
        .html('hi');
      tooltip.transition().style('opacity',1);
      // d3.select(this).style('fill','red');
      // plot3.selectAll('.rowLabelg')
      //   .style('opacity', 0.1);
      // plot3.selectAll('.colLabelg')
      //   .style('opacity', 0.1);
      plot3.selectAll('.cellg')
        .style('opacity', 0.1);

      d3.select(this)
        .style('opacity', 1);
      plot3.selectAll('.cellg').filter(function(e,j){
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

         plot3.selectAll('.rowLabelg')
           .style('opacity', 1);
         plot3.selectAll('.colLabelg')
           .style('opacity', 1);
         plot3.selectAll('.cellg')
           .style('opacity', 1);

    })
    .on('click',function(d){

    });

    plot3.append('g').selectAll('.rowLabelg')
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

    plot3.append('g').selectAll('.colLabelg')
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
