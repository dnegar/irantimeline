


function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function convertToNumber(text) {

  const persianToEnglishMap = {
      '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
      '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
  };

  const converted = text.replace(/[\u06F0-\u06F9]/g, char => persianToEnglishMap[char]);

  return Number(converted);
}

const milestonePlugin = (hook, vm) => {
  let maxHeight = 0;
  const adjustment = 60;
  let timelines = [];

  hook.beforeEach(function (content) {
    let events = [];
    let timelineData = [];

    const regex = /\.{3}رویدادنامه([\s\S]*?)\.{3}/g;
    const matches = content.match(regex);

    if (matches) {
      matches.forEach(match => {
        timelineData = [];
        const lines = match
          .trim()
          .split('\n')
          .map(line => line.trim());

        lines.forEach(line => {
          if (line.startsWith('>')) {
            const [time, desc] = line.split(' : ');
            timelineData.push({ time: convertToNumber(time.trim().replace(/>\s*/, '')), desc: desc.trim() });
          }
        });
        content = content.replace(match, `<div class="milestone" id="milestone-timeline-${timelines.length}"></div>`);
        timelines.push(timelineData);
      });
    }
    return content;
  });

  hook.doneEach(drawEvents);

  function drawEvents(){
   
    timelines.forEach((timelineData,time_index) => {
      const container = document.getElementById(`milestone-timeline-${time_index}`);
      if (!container || timelineData.length === 0) return;
      timelineData.sort((a, b) => a.time - b.time);
  
      const containerWidth = container.offsetWidth;
      const min = timelineData[0].time;
      const max = timelineData[timelineData.length - 1].time;
  
      // Split events into two groups
      const topEventsHTML = [];
      const bottomEventsHTML = [];
  
      // Reverse the array to match your original ordering
      timelineData.forEach((event, index) => {
        const normalized = (event.time - min) / (max - min);
        const positionPercent = (1-(1 - normalized)) * 100;
  
        // Build the event's HTML
        const eventHTML = `
          <div 
            ${(index === timelineData.length - 1)?"id='last-item-"+time_index+"'":""}
            class="milestone-event  ${index % 2 === 0 ? 'top' : 'bottom'}"
            style="right:${positionPercent}%; position: absolute;">
            <div class="milestone-item-arrow">
              <div class="milestone-connector"></div>
              <div class="milestone-circle"></div>
            </div>
            <div class="milestone-item-content">
              <div class="milestone-year">${event.time}</div>
              <div class="milestone-description">${marked(event.desc)}</div>
            </div>
          </div>
        `;
  
        if (index % 2 === 0) {
          topEventsHTML.push(eventHTML);
        } else {
          bottomEventsHTML.push(eventHTML);
        }
      });
  
      // Build the final HTML for the timeline container.
      const timelineHTML = `
        <div class="milestone-container">
          <div class="milestone-horizontal"></div>
          <div class="top-container">
            ${topEventsHTML.join('')}
          </div>
          <div class="bottom-container">
            ${bottomEventsHTML.join('')}
          </div>
        </div>
      `;
  
      container.innerHTML = timelineHTML;

      lastElement = document.getElementById(`last-item-${time_index}`);
  
      reverseLastEvent(lastElement);
      
      // After rendering the timeline, adjust for collisions
      adjustTimelineEvents(container);
      
    });
  }

  function reverseLastEvent(lastEvent) {

    lastEvent.classList.add("reverse");

    // Adjust position
    const lastEventWidth = lastEvent.offsetWidth;   
    lastEvent.style.right = `calc(${lastEvent.style.right} - ${lastEventWidth}px)`;
  }

  function adjustTimelineEvents(container) {
    // Process both groups independently.
    adjustGroup(container, '.top-container', true); 
    adjustGroup(container, '.bottom-container', false); 
  }

  function adjustGroup(container, selector, istop) {
    
    // Get all timeline events in the group
    let events = container.querySelectorAll(selector + ' .milestone-event');
    if (!events || events.length === 0) return;
  
    // Convert to an array and sort by their right position
    events = Array.from(events);
    
    // First pass: Adjust events for overlap
    for (let i = events.length - 1; i >= 0; i--) {
      const current = events[i];
      let currentRect = current.getBoundingClientRect();
  
      if (i + 1 < events.length) {
        const nextEvent = events[i + 1];
        const nextRect = nextEvent.getBoundingClientRect();
  
        const horizontalOverlap = !(currentRect.left > nextRect.right || currentRect.right < nextRect.left);
        const verticalOverlap = !(currentRect.bottom < nextRect.top || currentRect.top > nextRect.bottom);
  
        if (horizontalOverlap && verticalOverlap) {
          
          let currentHeight = parseFloat(current.style.height) || adjustment;
          currentHeight += nextRect.height;
  
          current.style.height = currentHeight + 'px';
          if (istop) {
            current.style.top = -currentHeight + adjustment + 'px';
          }
          currentRect = current.getBoundingClientRect();
        }
      }
    }
  
    // Second pass: Check for overlaps with previous events and apply 'reverse' class
    for (let i = 1; i < events.length; i++) {
  
      const current = events[i];

      if(!current.id.includes("last-item")){
        const prev = events[i - 1];
        const preprev = events[i - 2];
        const currentRect = current.getBoundingClientRect();
        const prevRect = prev.getBoundingClientRect();
        const preprevRect = preprev?.getBoundingClientRect();
        
        const horizontalOverlap = (currentRect.left+currentRect.width > prevRect.right || currentRect.right+currentRect.width  < prevRect.left);
        const verticalOverlap = (currentRect.bottom < prevRect.top || currentRect.top > prevRect.bottom);
        
        if (horizontalOverlap) {
          current.classList.add('reverse');
          current.style.right = `calc(${current.style.right} - ${currentRect.width}px)`
          
          let currentHeight = adjustment;
          current.style.height = currentHeight + 'px';
          if (istop) {
            current.style.top = -currentHeight + adjustment + 'px';
          }
        } else if(currentRect.height > prevRect.height){
          current.classList.add('reverse');
          current.style.right = `calc(${current.style.right} - ${currentRect.width}px)`
          current.style.height = prevRect.height + adjustment + 'px';
          if (istop) {
            current.style.top = -prevRect.height  + 'px';
          }
        }
  
        if (currentRect.height > maxHeight) {
          
          maxHeight = currentRect.height;
        }
      }
      
    }
    // Apply the height
    container.closest('.milestone').style.height = (maxHeight+60) + "px";
    maxHeight = 0;
  }

  window.onresize = debounce(() => {
    maxHeight = 0;
    drawEvents();
  }, 200);
};

window.$docsify = window.$docsify || {};
window.$docsify.plugins = (window.$docsify.plugins || []).concat(milestonePlugin);

