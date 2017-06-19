// Change depending on window size
const windowWidth = $(window).width();
console.log(windowWidth);
const itemWidth = windowWidth < 600 ? Math.floor(windowWidth * 0.9) : 300;
console.log(itemWidth);
// const itemWidth = 300;
const age_margin = {top: 40, right: 40, bottom: 40, left: 40},
      age_width = itemWidth - age_margin.left - age_margin.right,
      age_height = 200 - age_margin.top - age_margin.bottom;

d3.selectAll(".grid")
  .style("width", (Math.max(1, Math.floor($(window).width() / itemWidth) - 1)) * itemWidth + "px")

d3.csv("team_by_age.csv", function(error, data) {

  data.forEach(d => d.id = parseInt(d.id));
  const yMax = _.max(data.map(d => d.id));
  const yScale = d3.scaleLinear()
      .domain([0, yMax])
      .range([age_height, 0]);

  const xScale = d3.scaleBand()
      .domain(_.uniq(data.map(d => d.age)).sort())
      .range([0, age_width])
      .paddingInner(0.1)
      .paddingOuter(0);

  // Nest data by symbol.
  const teams = d3.nest()
      .key(d => d.team)
      .entries(data);

  // console.log(teams)
  const olderAges = ["26 to 29 years old", "30 to 32 years old", "33 to 36 years old", "37 to 40 years old", 
                   "41 to 44 years old", "45 to 48 years old", "49 to 52 years old",
                   "53 to 56 years old", "57 to 59 years old", "60 years or older"]

  // Add an SVG element for each symbol, with the desired dimensions and margin.
  const svg = d3.select(".grid").selectAll("svg")
      .data(teams)
    .enter().append("div")
      // for isotope sorting
      .attr("data-team-name", d => d.key)
      .attr("data-number-users", d => _.sum(d.values.map(c => c.id)))
      .attr("data-fanbase-age", d => {
        // there's several ways to calculate this, since we can't just use the mean
        // my way: the % over 30 years, excluding "Other"
        // console.log(_.sum(_.filter(d.values, obj => olderAges.indexOf(obj.age) != -1).map(c => c.id)))
        let numOlderFolks = _.sum(_.filter(d.values, obj => olderAges.indexOf(obj.age) != -1).map(c => c.id));
        return numOlderFolks / _.sum(d.values.map(c => c.id));
      })
      .attr("class", "team-bar-chart")
      .style("width", age_width + age_margin.left + age_margin.right + "px")
      .style("height", age_height + age_margin.top + age_margin.bottom + "px")
    .append("svg:svg")
      .attr("width", age_width + age_margin.left + age_margin.right)
      .attr("height", age_height + age_margin.top + age_margin.bottom)
    .append("g")
      .attr("transform", "translate(" + age_margin.left + "," + age_margin.top + ")");

  // Interactivity functions
  const mouseover = (d) => {
    mousemove.call(this)
  }

  const mouseout = (d) => {
    caption.text("")
    curAgeBracket.text("Age")
    d3.selectAll(".age-bracket-"+d.age.split(" ")[0])
      .classed("age-selected", false);
    d3.selectAll(".caption-line")
      .classed("caption-line-hidden", true);
  }

  const mousemove = (d) => {

    caption
      .attr("x", age_width)
      .attr("y", c => {
        // So, so sorry for all the one-letter variables, but they're throw-aways anyway
        return yScale(_.find(c.values, a => a.age == d.age).id);
      })
      .text(c => _.find(c.values, a => a.age == d.age).id);

    captionLine
      .attr("x1", 0)
      // .attr("x1", xScale(d.age))
      .attr("y1", c => yScale(_.find(c.values, a => a.age == d.age).id))
      .attr("y2", c => yScale(_.find(c.values, a => a.age == d.age).id));
   
    curAgeBracket
      .text(d.age == "Other" ? "Unknown" : d.age)

    d3.selectAll(".caption-line")
      .classed("caption-line-hidden", false);

    d3.selectAll(".age-bracket-"+d.age.split(" ")[0])
      .classed("age-selected", true);
  }

  // Add an axis for each chart.
  yAxis = d3.axisLeft()
    .scale(yScale)
    .ticks(2)
    .tickSizeInner(0)
    .tickSizeOuter(0)
    .tickSize(-age_width)

  svg.append("g")
    .attr("class", "y axis bar-axis")
    .call(yAxis)

  // Add the bars. 
  svg.selectAll(".teams")
    .data(d => d.values).enter()
    .append("rect")
    // for scrubbing across all teams
    .attr("class", d => "bar age-bracket-"+d.age.split(" ")[0])
    .attr("width", xScale.bandwidth())
    .attr("height", d => yScale(yMax - d.id))
    .attr("x", d => xScale(d.age))
    .attr("y", d => yScale(d.id))
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseout", mouseout);

  // Add the team name.
  svg.append("text")
    .attr("x", age_width/2)
    .attr("y", -age_margin.top/2)
    .style("text-anchor", "middle")
    .attr("class", "team-title")
    .attr("alignment-baseline", "middle")
    .text(d => d.key == "Other" ? "Other / Unknown" : d.key);

  // Add interactivity text boxes
  const caption = svg.append("text")
    .attr("class", "bar-caption tick")
    .attr("text-anchor", "end")
    .style("pointer-events", "none")
    .attr("dy", -5);

  const captionLine = svg.append("line")
    .attr("class", "caption-line")
    .style("pointer-events", "none")
    .attr("x1", 0)
    .attr("x2", age_width)
    .attr("y1", 0)
    .attr("y2", 0)
    .classed("caption-line-hidden", true);;

  const curAgeBracket = svg.append("text")
    .attr("class", "age-bracket")
    .attr("text-anchor", "middle")
    .text("Age")
    .attr("alignment-baseline", "middle")
    .style("pointer-events", "none")
    .attr("dy", age_margin.bottom/2)
    .attr("x", age_width/2)
    .attr("y", age_height)

  // Initialize sorting library (isotope)
  const $grid = $('.grid').isotope({
    itemSelector: '.team-bar-chart',
    layoutMode: 'fitRows',
    fitRows: {
      gutter: 0
    },
    getSortData: {
      team: '[data-team-name]', // sort alphabetically
      numberOfUsers: '[data-number-users] parseInt', // sort by number of users
      fanbaseAge: '[data-fanbase-age] parseFloat' // sort by 
    }
  });

  // button event handlers
  $('.shuffle-btn').on("change", d => {
    const boolFlag = (d.target.id == "team") ? true : false; // want largest fanbases first
    $grid.isotope({ sortBy: d.target.id, sortAscending: boolFlag});
  });

});