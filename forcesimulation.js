//------------------------draw force simulation ------------------------------
//Set up a force simulation
var forceSimulationData = [];

for(var i=0; i<Object.keys(allIngredients).length; i++){
    forceSimulationData.push({
       name: Object.keys(allIngredients),
       x: w*Math.random(),
       y: h*Math.random(),
       r: 5+15*Math.random(),
      //  r: scaleLineWidth(d.count);
       color: 'red'// pink
      //  color:Math.random() >.5?'red':'blue'
    });
}

//Represent these 100 particles
var nodes = plot2.selectAll('.node')
    .data(forceSimulationData)
    .enter()
    .append('g').attr('class','node')
    .attr('transform',function(d){
       return 'translate('+ d.x+','+ d.y+')'
    });
nodes.append('circle').attr('class','outer')
    .attr('r',function(d){return d.r})
    .style('fill',function(d){return d.color});
nodes.append('circle').attr('class','inner')
    .attr('r',2)
    .style('fill',function(d){return d.color});
nodes.append('line').attr('class','velocity')
    .style('stroke',function(d){return d.color})
    .style('stroke-width','1px');

nodes.append('text')

//Set up a force simulation
var simulation = d3.forceSimulation(forceSimulationData)
    //.alpha(1)
    //.alphaDecay(0)
    //.alphaTarget(0)
    //.alphaMin(.001)
    .velocityDecay(.5)
    //.on('tick.log',function(){ console.log( this.alpha() )})
    .on('end',function(){ console.log('Force simulation stopped!') });

//Examples of different forces
//CENTER (compare this to positioning)
var forceCenter = d3.forceCenter(w/2,h/2);

//MANYBODY
var forceManyBody = d3.forceManyBody()
    .strength(0);

//COLLISION
var forceCollision = d3.forceCollide()
    .radius(function(d,i){
        return d.r;
    });

//POSITION
var forceX = d3.forceX()
    .x(function(d){return d.x});

var forceY = d3.forceY()
    .y(h/2);

//CUSTOM FORCE
var forceCustom = function(){

    var nodes;

    function force(alpha){
        //a custom force function that tries to separate nodes by their color
        var node, center;
        for(var i = 0, k = alpha*.1; i < nodes.length; i++){
            node = nodes[i];
            center = node.color=='red'?[w/3,h/2]:[w*2/3,h/2];
            node.vx += (center[0] - node.x)*k;
            node.vy += (center[1] - node.y)*k;
        }
        console.log('force custom');
    }

    force.initialize = function(_){
        nodes = _;
    }

    return force;
};

//Experiment with forces
simulation
    .force('center',forceCenter)
    .force('charge',forceManyBody)
    .force('collide',forceCollision)
    //.force('forceX',forceX)
    //.force('forceY',forceY)
    .force('custom',forceCustom())
    .on('tick.reposition', reposition);

function reposition(){
    nodes
        .attr('transform',function(d){
            return 'translate('+ d.x+','+ d.y+')'
        });
    nodes.select('.velocity')
        .attr('x2',function(d){return d.vx})
        .attr('y2',function(d){return d.vy});
}
