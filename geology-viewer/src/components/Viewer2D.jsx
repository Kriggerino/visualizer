import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styles from '../styles/Viewer.module.css';

export default function Viewer2D({ data, selectedSection }) {
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    if (!data || !selectedSection) return;

    const section = data.polygonsBySection.find(s => s.sectionName === selectedSection);
    if (!section) {
      const container = containerRef.current;
      const svg = d3.select(svgRef.current)
        .attr('width', container.clientWidth)
        .attr('height', container.clientHeight);
        
      svg.selectAll('*').remove();
      svg.append('text')
        .attr('x', container.clientWidth / 2)
        .attr('y', container.clientHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('class', styles.errorText)
        .text(`No section found with name: ${selectedSection}`);
      return;
    }

    if (!section.polygons.length) {
      const container = containerRef.current;
      const svg = d3.select(svgRef.current)
        .attr('width', container.clientWidth)
        .attr('height', container.clientHeight);
        
      svg.selectAll('*').remove();
      svg.append('text')
        .attr('x', container.clientWidth / 2)
        .attr('y', container.clientHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('class', styles.errorText)
        .text(`No polygons found in section: ${selectedSection}`);
      return;
    }

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const allPoints = section.polygons.flatMap(polygon => 
      polygon.points2D.map(point => point.vertex)
    );

    const xExtent = d3.extent(allPoints, d => d[0]);
    const yExtent = d3.extent(allPoints, d => d[1]);

    const padding = 40;
    const xScale = d3.scaleLinear()
      .domain([xExtent[0], xExtent[1]])
      .range([padding, width - padding]);
    
    const yScale = d3.scaleLinear()
      .domain([yExtent[0], yExtent[1]])
      .range([height - padding, padding]);

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    // Create main group for polygons
    const mainGroup = svg.append('g');
    
    // Create separate groups for axes
    const xAxisGroup = svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height - padding})`);
    
    const yAxisGroup = svg.append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${padding},0)`);

    // Draw polygons
    section.polygons.forEach(polygon => {
      const points = polygon.points2D;
      
      const lineGenerator = d3.line()
        .x(d => xScale(d.vertex[0]))
        .y(d => yScale(d.vertex[1]));

      mainGroup.append('path')
        .datum(points)
        .attr('d', lineGenerator)
        .attr('fill', `#${polygon.color}`)
        .attr('stroke', 'black')
        .attr('stroke-width', 1);
    });

    // Function to update axes during zoom
    const updateAxes = (transform) => {
      // Create new scaled axes
      const newXScale = transform.rescaleX(xScale);
      const newYScale = transform.rescaleY(yScale);
      
      const xAxis = d3.axisBottom(newXScale);
      const yAxis = d3.axisLeft(newYScale);
      
      xAxisGroup.call(xAxis);
      yAxisGroup.call(yAxis);
    };

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        mainGroup.attr('transform', event.transform);
        updateAxes(event.transform);
      });

    svg.call(zoom);

    // Add axis labels
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 5)
      .attr('text-anchor', 'middle')
      .text('X');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .text('Y');

  }, [data, selectedSection]);

  return (
    <div ref={containerRef} className={styles.viewerContainer}>
      <svg ref={svgRef} />
    </div>
  );
}