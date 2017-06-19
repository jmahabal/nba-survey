d3.csv("team_by_ethnicity.csv", function(error, data) {

  const windowWidth = $(window).width();
  const windowHeight = $(window).height();

  const margin = {top: 60, right: 10, bottom: 30, left: 10},
    width = windowWidth*0.95 - margin.left - margin.right,
    height = windowHeight*0.8 - margin.top - margin.bottom;

  var x = d3.scaleBand().range([0, width]).paddingOuter(0).paddingInner(0);
  const y = {};
  const dragging = {};

  const line = d3.line();
  var axis = d3.axisLeft();
  var background;
  var foreground;

  const svg = d3.select(".parcoords").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  const ethnicities = ["White/Total", "Asian / Pacific Islander/Total", "Hispanic or Latino/Total",
                       "Black or African American/Total", "Native American or American Indian/Total", "Other/Total", "Team"]
  const normalized_data = data.map(o => _.pick(o, ethnicities));
  // console.log(normalized_data)

  // Extract the list of dimensions and create a scale for each.
  x.domain(dimensions = d3.keys(normalized_data[0]).filter(function(d) {
    return d != "Team" && (y[d] = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0]));
  }));

  // Add grey background lines for context.
  background = svg.append("g")
      .attr("class", "background")
    .selectAll("path")
      .data(normalized_data)
    .enter().append("path")
      .attr("d", path)
      .attr("transform", d => "translate(" + (x.bandwidth()/2) + ")");

  // Interactivity functions

  const selectTeam = (d) => {
    d3.selectAll(".t-"+_.kebabCase(d))
      .classed("team-highlighted", true)
    d3.selectAll(".team-line")
      .classed("pale-line", c => {
        return c.Team == d ? false : true; // Every line except the one we want to highlight
    })
  }

  const deselectTeam = () => {
    d3.selectAll(".team-line")
      .classed("team-highlighted", false)
    d3.selectAll(".team-line")
      .classed("pale-line", false);
    $('.typeahead').typeahead('val', "");
  }

  const mouseover = (d) => {
    mousemove.call(this)
  }

  const mouseout = (d) => {
    deselectTeam();
  }

  const mousemove = (d) => {
    d3.selectAll(".t-"+_.kebabCase(d.Team))
      .classed("team-highlighted", true)
    d3.selectAll(".team-line")
      .classed("pale-line", c => {
        return c.Team == d.Team ? false : true; // Every line except the one we want to highlight
      });
    $('.typeahead').typeahead('val', d.Team);
  }

  // Add blue foreground lines for focus.
  foreground = svg.append("g")
      .attr("class", "foreground")
    .selectAll("path")
      .data(normalized_data)
    .enter().append("path")
      .attr("d", path)
      .attr("transform", d => "translate(" + (x.bandwidth()/2) + ")")
      .attr("class", d => "team-line t-"+_.kebabCase(d.Team))
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseout", mouseout);

  // Add a group element for each dimension.
  var g = svg.append("g")
    .selectAll(".dimension")
      .data(dimensions)
    .enter().append("g")
      .attr("class", "dimension")
      .attr("transform", d => "translate(" + (x(d) + x.bandwidth()/2) + ")")
      // .call(d3.drag()
      //   .subject(function(d) { return {x: x(d)}; })
      //   .on("start", function(d) {
      //     dragging[d] = x(d);
      //     background.attr("visibility", "hidden");
      //   })
      //   .on("drag", function(d) {
      //     dragging[d] = Math.min(width, Math.max(0, d3.event.x));
      //     foreground.attr("d", path);
      //     dimensions.sort(function(a, b) { return position(a) - position(b); });
      //     x.domain(dimensions);
      //     g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
      //   })
      //   .on("end", function(d) {
      //     delete dragging[d];
      //     transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
      //     transition(foreground).attr("d", path);
      //     background
      //         .attr("d", path)
      //       .transition()
      //         .delay(500)
      //         .duration(0)
      //         .attr("visibility", null);
      //   }));

  // Add an axis and title.
  g.append("g")
      .attr("class", "axis")
      .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
    .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .attr("transform", "rotate(90)")
      .attr("class", "axis ethnicity-axis")
      .attr("alignment-baseline", "middle")
      .style("text-anchor", "start")
      .text(d => {
        return d == "Other/Total" ? "Mixed or Other or Unknown" : d.replace("/Total", "")
      });

  // // Add and store a brush for each axis.
  // g.append("g")
  //     .attr("class", "brush")
  //     .each(function(d) {
  //       d3.select(this).call(y[d].brush = d3.brushY().on("start", brushstart).on("brush", brush));
  //     })
  //   .selectAll("rect")
  //     .attr("x", -8)
  //     .attr("width", 16);

  // const currentTeam = svg.append("text")
  //   .attr("class", "caption")
  //   .attr("y", 0)
  //   .attr("x", 0)
  //   .attr("transform", "translate(" + (width/2) + ",-" + (margin.top/2) + ")")
  //   .text("");

  // Dropdown UI

  const teams = data.map(o => _.pick(o, "Team").Team);

  var substringMatcher = function(strs) {
    return function findMatches(q, cb) {
      var matches, substringRegex;

      // an array that will be populated with substring matches
      matches = [];

      // regex used to determine if a string contains the substring `q`
      substrRegex = new RegExp(q, 'i');

      // iterate through the pool of strings and for any string that
      // contains the substring `q`, add it to the `matches` array
      $.each(strs, function(i, str) {
        if (substrRegex.test(str)) {
          matches.push(str);
        }
      });

      cb(matches);
    };
  };

  $('#scrollable-dropdown-menu .typeahead').typeahead({
    hint: true,
    highlight: true,
    minLength: 1
  },
  {
    name: 'teams',
    source: substringMatcher(teams)
  });

  $('.typeahead').bind('typeahead:select', (ev, suggestion) => selectTeam(suggestion));

  $('.typeahead').bind('typeahead:change', () => {
    if (!(_.find(teams, $('.typeahead')[1].textContent))) {
      deselectTeam();
    };
  });

function position(d) {
  var v = dragging[d];
  return v == null ? x(d) : v;
}

function transition(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
}

function brushstart() {
  d3.event.sourceEvent.stopPropagation();
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
  // console.log(y);
  // console.log(x);
  // console.log(y[dimensions[0]].brush.extent()());  
  console.log(d3.event.selection)

  var actives = dimensions.filter(function(p) { 
        return false;
        // return Math.random() >= 0.5;
        // return !y[p].brush.empty(); 
    });

  var extents = actives.map(p => d3.event.selection.map(y[p].invert));
      // extents = actives.map(p => y[p].brush.extent());
  console.log(extents)
  foreground.style("display", function(d) {
    return actives.every(function(p, i) {
      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
    }) ? null : "none";
  });
}

});