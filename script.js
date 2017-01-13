console.log('Cuisine Recipe project');

var m = {t:50,r:50,b:50,l:50},
w = document.getElementById('canvas').clientWidth,
h = document.getElementById('canvas').clientHeight;

var pairedData = [];

var allIngredients = {};
var allCuisines = [];
var rectIngredientWidth = 5, rectIngredientHeight = 5;
var rectCuisineWidth = 5, rectCuisineHeight = 3;

var plot = d3.select('.canvas')
  .append('svg')
  .attr('width', w + m.l + m.r)
  .attr('height', 1.1*h + m.t + m.b)
  .append('g')
  .attr('transform','translate('+ m.l+','+ m.t+')');

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
  .defer(d3.csv,'data/recipe.csv',parse)
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
  console.log(filteredIngredients);
  console.log(filteredIngredients.indexOf(data[0].ingredients[2]));
}


function draw(data) {
  //-----------------------------Filter Data------------------------------------
  var filteredCuisines = allCuisines.filter(function(d){
    return d == 'French' || d == 'Italian' ||  d == 'Asian';
  });
  // console.log('filteredCuisines: '+filteredCuisines);
  var filteredData = data.filter(function(d){
    return d.cuisine == 'French'|| d == 'Italian' ||  d == 'Asian';
  });
  // console.log('filteredData: '+filteredData.length); // 136

  var filteredIngredients = Object.values(allIngredients);
  filteredIngredients = filteredIngredients.filter(function(d){
    return d.count > 1000;
  });

  for (var i = 0; i < filteredIngredients.length; i++) {
    filteredIngredients[i].index = i ;
  }

  scaleXIngredient.domain([0, filteredIngredients.length]);
  prepareMatrix(data,filteredIngredients);
  // console.log(filteredIngredients); //(array of object with name, count. index);
  console.log('filteredIngredients: '+filteredIngredients.length); //84

  for (var i = 0; i < filteredCuisines.length; i++) {
    // filteredCuisines[i]
    for (var j = 0; j < filteredIngredients.length; j++) {
      var element = {};
      element.cuisine = filteredCuisines[i];
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
  // console.log(pairedData);

//------------------------DRAW ingredients--------------------------------------
  var rectIngredient = plot.selectAll('rect').data(filteredIngredients);

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
  var rectCuisine = plot.selectAll('.rectCuisine').data(filteredCuisines);

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
  plot.selectAll('.line')
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
      var g = plot.append("g")
        .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")")
        .datum(chord(matrix));

      var group = g.append("g")
        .attr("class", "chordChart groups")
        .selectAll("g")
        .data(function(chords) {
          console.log(chords);
          return chords.groups; })
        .enter().append("g");

      group.append("path")
        .style("fill", function(d){return colorScale20c(d.index)})
        .style("stroke", function(d) { return d3.rgb(colorScale20c(d.index)).darker(); })
        .attr("d", arc);

      group.append("text")
        .each(function(d) { d.angle = ((d.startAngle + d.endAngle) / 2);})
        .attr("dy", ".35em")
        .attr("class", "chordTitle")
        .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
        .attr("transform", function(d,i) {
          var c = arc.centroid(d);
          return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
          + "translate(" + (innerRadius + 55) + ")"
          + (d.angle > Math.PI ? "rotate(180)" : "")
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

      g.append("g")
        .selectAll("path")
        .data(function(chords) {return chords; })
        .enter().append("path")
        .attr('class',function(d){ // append different classes to chords/ribbons
          return 'ribbon ' + d.source.index + 'Ribbon ' + d.target.index + 'Ribbon';
        })
        .attr("d", ribbon)
        .style("fill", function(d) {return colorScale20c(d.target.index); })
        .style('opacity',function(d){return scaleOpacity(d.target.value);})
        .style("stroke", function(d) {return d3.rgb(colorScale20c(d.target.index)).darker(); });


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
}

function parse(d){
  var entry = {
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
