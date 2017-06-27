//LAYOUT 1.
let button = document.getElementById("com");
button.addEventListener("click", loadGraph);
function loadGraph(){
//  hide layout 2 and texts associated with it, display layout 1 and its texts
  d3.select("svg").remove();
  d3.select("#text1").style("display", "none");
  d3.select("#legend1").style("display", "none");
  d3.select("#legend").style("display", "initial");
  d3.select("#text").style("display", "initial");
  d3.select("#names").style("display", "initial");
  
  let width = 650,
    height = 500;
  let path;
  let node;
  
//set up the simulation 
  let simulation = d3.forceSimulation()
    .force("link", d3.forceLink()
         .distance(200)
         .strength(0.1))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide",d3.forceCollide( function(d){return d.relations + 20 }).iterations(16) )
    .force("charge", d3.ForceManyBody);

//create SVG
  let svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id","networkViz");

//load external data
  d3.json("communication.json", function(error, graph) {
    if (error) throw error;

// append arrows (source: http://www.coppelia.io/2014/07/an-a-to-z-of-extra-features-for-the-d3-force-layout/)
  svg.append("svg:defs").selectAll("marker")
    .data(["end"])    
    .enter().append("svg:marker")    
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", 0)
    .attr("markerWidth", 9)
    .attr("markerHeight", 7)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

// add links and arrows
  path = svg.append("svg:g").selectAll("path") 
    .data(graph.links)
    .enter().append("path")
    .attr("class", function(d) { return d.type; })
    .attr("marker-end", "url(#end)")

// define the nodes
  node = svg.selectAll(".node")
    .data(graph.nodes)
    .enter().append("g")
    .attr("class", "node")
    .on("mouseover", mouseover)
    .on("mouseout", mouseout)
    .on("click", connectedNodes)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

//functions for highlighting selected nodes
  function mouseover() {
    d3.select(this).select("circle").transition()
      .duration(250)
      .attr('r', 10)
      .style("fill", "white");
    d3.select(this).select("text").transition()
      .duration(250)
      .style('font-size', 21);
    }

  function mouseout() {
   d3.select(this).select("circle").transition()
      .duration(250)
      .attr('r', 5)
  d3.select(this).select("text").transition()
      .duration(250)
      .style('font-size', 12);
    }

// add nodes and define the radius of each node
  node.append("circle")
    .attr("r", function(d){return Math.round(d.relations)}); 

// add labels 
  let checkbox = document.querySelector("input[name=names]");
  checkbox.onchange = function() {
      if(this.checked) {
        node.append("text")
          .attr("x", 12)
          .attr("dy", ".35em")
          .text(function(d) { return d.name; });
          /*path.style("opacity", 0.6);*/
      } else {
        svg.selectAll("text").remove();
        path.style("opacity", 1);
      }
  }
  
//add data and tick instructions
  simulation
    .nodes(graph.nodes)
    .on("tick", tick);

  simulation.force("link")
    .links(graph.links);

  // add curved lines
  function tick() {
      path.attr("d", function(d) {
       let dx = d.target.x - d.source.x,
           dy = d.target.y - d.source.y,
           dr = Math.sqrt(dx * dx + dy * dy);
           return "M" + 
           d.source.x + "," + 
           d.source.y + "A" + 
           dr + "," + dr + " 0 0,1 " + 
           d.target.x + "," + 
           d.target.y;
    });
  
  // adjusting the end points of paths in order to adjust the position of arrows (source: https://stackoverflow.com/questions/28101774/d3-force-layout-moving-arrows-along-links-depending-on-node-radius)
  function linkArc(d) {
    let targetX = d.target.x - d.target.started,
      targetY = d.target.y - d.target.started,
      dx = targetX - d.source.x,
      dy = targetY - d.source.y,
      dr = (d.straight == 0)?Math.sqrt(dx * dx + dy * dy):0;
    return "M" + d.source.x + "," + d.source.y +
       " L " + targetX + "," + targetY;
}

  node
    .attr("transform", function(d) { 
	   return "translate(" + d.x + "," + d.y + ")"; });
    }


// filter functions
    d3.selectAll("input[name=filter]").on("change", function(d){
    // value of selected radio
      let value = this.value;
    // style for all nodes and links
      node.style("opacity", 1);
      path.style("opacity", 1);
   // hide those that aren't chosen
    if (value !== "all"){
       path.filter(function(d){
          return d.type != value;
        })
       .style("opacity", "0.1");
       }
});


// highlighting nodes and its neighbours (source: https://stackoverflow.com/questions/8739072/highlight-selected-node-its-links-and-its-children-in-a-d3-force-directed-grap)
  let toggle = 0;
//Create an array for neighbours search
  let linkedByIndex = {};
    for (i = 0; i < graph.nodes.length; i++) {
    linkedByIndex[i + "," + i] = 1;
};
  graph.links.forEach(function (d) {
    linkedByIndex[d.source.index + "," + d.target.index] = 1;
});
// look up whether a pair are neighbours
function neighboring(a, b) {
    return linkedByIndex[a.index + "," + b.index];
}
function connectedNodes() {
    if (toggle == 0) {
        //hide all but the neighbouring nodes
        d = d3.select(this).node().__data__;
        node.style("opacity", function (o) {
            return neighboring(d, o) | neighboring(o, d) ? 1 : 0.1;
        });
        path.style("opacity", function (o) {
            return d.index==o.source.index | d.index==o.target.index ? 1 : 0.1;
        })
        toggle = 1;
    } else {
        //again show all the nodes
        node.style("opacity", 1);
        path.style("opacity", 1);
        toggle = 0;
    }
}
});
 //drag and drop functions 
  function dragstarted(d) {
   if (!d3.event.active) simulation.alphaTarget(0.3).restart();
   d.fx = d.x;
   d.fy = d.y;
  }

  function dragged(d) {
   d.fx = d3.event.x;
   d.fy = d3.event.y;
  }

  function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
   d.fx = null;
   d.fy = null;
  }
};

// LAYOUT 2.
let button1 = document.getElementById("wiw");
button1.addEventListener("click", loadGraph1);
function loadGraph1(){
  d3.select("svg").remove();
  d3.select("#legend").style("display", "none");
  d3.select("#text").style("display", "none");
  d3.select("#names").style("display", "none");
  d3.select("#text1").style("display", "initial");
  d3.select("#legend1").style("display", "initial");
  let width1 = 370;
  let height1 = 370;
  
  //create DIV for tooltips
  let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
  
  //append SVG
  let svg1 = d3.select("body").append("svg")
    .attr("width", width1)
    .attr("height", height1)
    .attr("id","networkViz1");
  let radius = 15; 

//load external data
  d3.json("WhoIsWho.json", function(error, graph1) {
  if (error) throw error;

//set up the simulation 
  let simulation = d3.forceSimulation()
	  .nodes(graph1.nodes_data);
  let link_force =  d3.forceLink(graph1.links_data)           
  let charge_force = d3.forceManyBody()
    .strength(-100);    
  let center_force = d3.forceCenter(width1 / 2, height1 / 2);  
  
// arrange person and character nodes
// source: http://www.puzzlr.org/force-directed-graph-custom-forces/  
function splitting_force() { 
  for (let i = 0, n = graph1.nodes_data.length; i < n; ++i) {
    curr_node = graph1.nodes_data[i];
    if(curr_node.type == "character"){
        curr_node.x += 5;
    } else if(curr_node.type == "person"){
        curr_node.x -= 5;
      }    
    }
  }

  simulation
      .force("charge_force", charge_force)
      .force("center_force", center_force)
      .force("links",link_force)
      .force("collide",d3.forceCollide( function(d){return radius}).iterations(16) )
      .force("splitting",splitting_force);

//add tick instructions 
  simulation.on("tick", tickActions );
  
//append new links 
let link1 = svg1.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph1.links_data)
    .enter().append("line")
      .attr("stroke-width", 2)
      .style("stroke", linkColour);        

//append new nodes 
let node1 = svg1.append("g")
        .attr("class", "node1") 
        .selectAll("circle")
        .data(graph1.nodes_data)
        .enter()
        .append("circle")
        .attr("r", radius)
        .attr("fill", circleColour)
        //functions showing tooltips
        .on("mouseover", function(d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div.html(d.name);
         })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
          })
;
// drag and drop functions
  let drag_handler = d3.drag()
	 .on("start", dragstarted1)
	 .on("drag", dragged1)
	 .on("end", dragended1);	
	
  drag_handler(node1)

  function dragstarted1(d) {
   if (!d3.event.active) simulation.alphaTarget(0.3).restart();
   d.fx = d.x;
   d.fy = d.y;
 }

 function dragged1(d) {
   d.fx = d3.event.x;
   d.fy = d3.event.y;
 }

 function dragended1(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
   d.fx = null;
   d.fy = null;
 }

//Functions
//Choosing the circle color
  function circleColour(d){
	  if(d.type =="character"){
		return "#9ff5cf";
	 } else {
		return "#9febf5";
	 }
  }

//Choosing the line colour 
function linkColour(d){
	if(d.value == 1){
		return "#112F41";
	} 
  else if(d.value == 2){
		return "#068587";
	}
 else if(d.value == 3){
		return "#4FB99F";
	}
  else if(d.value == 4){
		return "#F2C434";
	}
  else {
		return "#ED553B";
	}
}

//tick functions
function tickActions() {
      node1
        .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width1 - radius, d.x)); })
        .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height1 - radius, d.y)); });
        
    link1
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
	  } 
});
}
