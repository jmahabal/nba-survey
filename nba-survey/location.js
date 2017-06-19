const cellSize = 14;

const location_margin = {top: 160, right: 20, bottom: 20, left: 145},
      location_width = cellSize*52,
      location_height = cellSize*32;

d3.csv("team_by_home_state.csv", function(error, data) {
  
  // const teams = _.uniq(data.map(d => d.team));
  // Order teams by region, roughly
  const teams = ['Toronto Raptors', 'Boston Celtics', 'New York Knicks', 'Brooklyn Nets',
                 'Philadelphia 76ers', 'Washington Wizards', 'Charlotte Hornets', 
                 'Memphis Grizzlies', 'Atlanta Hawks', 'Miami Heat', 'Orlando Magic',
                 'Milwaukee Bucks', 'Minnesota Timberwolves', 'Detroit Pistons', 'Chicago Bulls',
                 'Cleveland Cavaliers', 'Indiana Pacers', 'New Orleans Pelicans', 'Houston Rockets',
                 'Dallas Mavericks', 'San Antonio Spurs', 'Oklahoma City Thunder', 'Denver Nuggets',
                 'Utah Jazz', 'Phoenix Suns', 'Sacramento Kings', 'Golden State Warriors', 
                 'Los Angeles Lakers', 'LA Clippers', 'Seattle Super Sonics', 'Portland Trail Blazers', 
                 'Other']

  // const states = _.uniq(data.map(d => d.state));
  // Order states by region, roughly
  const states = ["Maine", "New Hampshire", "Vermont", "Massachusetts", "Connecticut",
                  "Rhode Island", "New York", "New Jersey", "Pennsylvania", "Delaware", "Maryland",
                  "Virginia", "West Virginia", "North Carolina", "South Carolina", 
                  "Georgia", "Florida", "Kentucky", "Tennessee", "Alabama", "Mississippi", "Ohio", 
                  "Michigan", "Indiana", "Illinois", "Wisconsin", "Minnesota", "Iowa", "Missouri",
                  "Kansas", "Nebraska", "South Dakota", "North Dakota", "Arkansas", "Louisiana", 
                  "Oklahoma", "Texas", "Montana", "Wyoming", "Colorado", "Idaho", "Utah", "New Mexico", 
                  "Arizona", "Nevada", "California", "Oregon", "Washington", "Alaska", "Hawaii", "Other"]

  const xScale = d3.scaleBand()
    .domain(states)
    .range([0, location_width])
    .paddingInner(0.1)
    .paddingOuter(0);

  const yScale = d3.scaleBand()
    .domain(teams)
    .range([0, location_height])
    .paddingInner(0.1)
    .paddingOuter(0);

  const countMax = _.max(data.map(d => parseInt(d.count)));
  const cellNumbers = [1, 5, 10, 50, 100, countMax];
  const colorScale = d3.scaleLog() // Is using a log scale wrong? Hmm...
    .domain([1, countMax])
    // .range([d3.interpolateBlues(0), d3.interpolateBlues(1)])
    .range(["rgb(250,239,209)", "rgb(4,108,154)"])

  const svg = d3.selectAll(".heatmap")
    .append("svg")
      .attr("width", location_width + location_margin.left + location_margin.right)
      .attr("height", location_height + location_margin.top + location_margin.bottom)
    .append("g")
      .attr("transform", "translate(" + location_margin.left + "," + location_margin.top + ")");

  // Interactivity functions

  function roundedDown(count) {
    return _.findLast(cellNumbers, o => count >= o);
  }

  const mouseover = (d) => {
    mousemove.call(this);
  }

  const mouseout = (d) => {
    d3.selectAll(".location-t-"+_.kebabCase(d.team))
      .classed("label-highlighted", false)
    d3.selectAll(".location-s-"+_.kebabCase(d.state))
      .classed("label-highlighted", false)
    d3.selectAll(".t-rect")
      .classed("rect-hidden", true)
    d3.selectAll(".s-rect")
      .classed("rect-hidden", true)
    d3.selectAll(".caption")
      .classed("caption-hidden", true)
    d3.selectAll(".count-square")
      .classed("square-stroke-hidden", true)
  }

  const mousemove = (d) => {
    d3.selectAll(".location-t-"+_.kebabCase(d.team))
      .classed("label-highlighted", true)
    d3.selectAll(".location-s-"+_.kebabCase(d.state))
      .classed("label-highlighted", true)
    d3.selectAll(".t-rect")
      .classed("rect-hidden", false)
      .attr("y", yScale(d.team))
    d3.selectAll(".s-rect")
      .classed("rect-hidden", false)
      .attr("x", xScale(d.state))
    d3.selectAll(".caption-text")
      .text(d.count)
    d3.selectAll(".caption")
      .classed("caption-hidden", false)
    d3.selectAll(".count-text")
      .text((d.count == 1) ? "NBA fan" : "NBA fans")
  }

  // Construct the actual heatmap

  svg.selectAll("rect")
    .data(data).enter()
    .append("rect")
    .attr("class", d => "count-square square-t-"+_.kebabCase(d.team)+" square-s-"+_.kebabCase(d.state))
    .attr("x", d => xScale(d.state))
    .attr("y", d => yScale(d.team))
    .classed("square-stroke-hidden", true)
    .attr("stroke", "rgb(253,100,103)")
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("fill", d => colorScale(d.count))
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseout", mouseout);

  // Add background rects for highlighting 

  svg.append("rect")
    .attr("class", "highlight-rect t-rect")
    .attr("x", -location_margin.left)
    .attr("y", 0)
    .classed("rect-hidden", true)
    .attr("width", location_margin.left)
    .attr("height", yScale.bandwidth());

  svg.append("rect")
    .attr("class", "highlight-rect s-rect")
    .attr("y", -(location_margin.top - 2*cellSize - 6))
    .attr("x", 0)
    .classed("rect-hidden", true)
    .attr("height", location_margin.top - 2*cellSize - 6)
    .attr("width", xScale.bandwidth());

  // Add axes

  yAxis = d3.axisLeft()
    .tickSize(0)
    .scale(yScale);

  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
  .selectAll("text")
    .attr("dx", "-0.2rem")
    .attr("class", d => "location-t-"+_.kebabCase(d));

  xAxis = d3.axisTop()
    .tickSize(0)
    .scale(xScale);

  svg.append("g")
    .attr("class", "x axis")
    .call(xAxis)
  .selectAll("text")
    .attr("dx", "-0.5rem")
    .attr("dy", xScale.bandwidth()/4)
    .attr("class", d => "location-s-"+_.kebabCase(d))
    .attr("transform", "rotate(90)")
    .attr("alignment-baseline", "middle")
    .style("text-anchor", "end");

// Create rectangles behind each label to display aggregated results

  const team_agg_data = data.reduce((prevVal, elem) => {
    if (!(_.isUndefined(prevVal[elem.team]))) {
      prevVal[elem.team] += parseInt(elem.count);
    } else {
      prevVal[elem.team] = 0;
    }
    return prevVal;
  }, {}); 

  const state_agg_data = data.reduce((prevVal, elem) => {
    if (!(_.isUndefined(prevVal[elem.state]))) {
      prevVal[elem.state] += parseInt(elem.count);
    } else {
      prevVal[elem.state] = 0;
    }
    return prevVal;
  }, {}); 

  console.log(state_agg_data);

  teams.forEach(d => {
    svg.selectAll(".team-rects")
      .data([{team: d}]).enter()
      .append("rect")
      .attr("class", "highlight-rect t-rect-"+_.kebabCase(d))
      .attr("x", -location_margin.left)
      .attr("y", yScale(d))
      .attr("opacity", 0)
      .attr("width", location_margin.left)
      .attr("height", yScale.bandwidth())
      .on("mousemove", (t) => {
        d3.selectAll(".caption-text")
          .text(team_agg_data[t.team])
        d3.selectAll(".caption")
          .classed("caption-hidden", false)
        d3.selectAll(".count-text")
          .text((team_agg_data[t.team] == 1) ? "NBA fan" : "NBA fans");
        d3.selectAll(".location-t-"+_.kebabCase(t.team))
          .classed("label-highlighted", true)
        d3.selectAll(".t-rect")
          .classed("rect-hidden", false)
          .attr("y", yScale(t.team))
        d3.selectAll(".square-t-"+_.kebabCase(t.team))
          .classed("square-stroke-hidden", false)
      })
      .on("mouseout", mouseout);
  })

  states.forEach(d => {
    svg.selectAll(".state-rects")
      .data([{state: d}]).enter()
      .append("rect")
      .attr("class", "highlight-rect s-rect-"+_.kebabCase(d))
      .attr("y", -(location_margin.top - 2*cellSize - 6))
      .attr("x", xScale(d))
      .attr("opacity", 0)
      .attr("height", location_margin.top - 2*cellSize - 6)
      .attr("width", xScale.bandwidth())
      .on("mousemove", (s) => {
        d3.selectAll(".caption-text")
          .text(state_agg_data[s.state])
        d3.selectAll(".caption")
          .classed("caption-hidden", false)
        d3.selectAll(".count-text")
          .text((state_agg_data[s.state] == 1) ? "NBA fan" : "NBA fans");
        d3.selectAll(".location-s-"+_.kebabCase(s.state))
          .classed("label-highlighted", true)
        d3.selectAll(".s-rect")
          .classed("rect-hidden", false)
          .attr("x", xScale(s.state))
        d3.selectAll(".square-s-"+_.kebabCase(s.state))
          .classed("square-stroke-hidden", false)
      })
      .on("mouseout", mouseout);
  })

  // Add legend
  // Roll my own implementation 

  const legend = svg.append("g")
      // center the legend
      .attr("transform", "translate(" + (((location_width + location_margin.left + location_margin.right)/2) - location_margin.left - ((2*cellSize + 1) * cellNumbers.length / 2)) + ",-" + (location_margin.top) + ")");

  // Add rects

  legend.selectAll("legend-rect")
    .data(cellNumbers).enter()
    .append("rect")
      .attr("x", (d, i) => (2*cellSize + 1)*i)
      .attr("y", 0)
      .attr("width", 2*cellSize)
      .attr("height", cellSize)
      .attr("fill", d => colorScale(d))
      .attr("class", d => "legend-rect legend-rect-"+d)

  legend.selectAll("legend-text")
    .data(cellNumbers).enter()
    .append("text")
      .attr("x", (d, i) => (2*cellSize + 1)*i)
      .attr("dx", cellSize)
      .attr("y", cellSize)
      .attr("dy", 10)
      .text(d => d)
      .attr("class", d => "legend-text legend-text-"+d)

  const currentCount = svg.append("text")
    .attr("class", "caption-text caption")
    .attr("y", 0)
    .attr("x", 0)
    .attr("transform", "translate(" + (-location_margin.left/2) + "," + (-location_margin.top/4 - 16) + ")")
    .text("");

  const countText = svg.append("text")
    .attr("class", "count-text caption")
    .attr("y", 0)
    .attr("x", 0)
    .attr("transform", "translate(" + (-location_margin.left/2) + "," + (-location_margin.top/4) + ")")
    .text("NBA fans")
    .classed("caption-hidden", true);

});