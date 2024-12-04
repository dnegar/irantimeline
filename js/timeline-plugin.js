
function convertToNumber(text) {

  const persianToEnglishMap = {
      '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
      '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
  };

  const converted = text.replace(/[\u06F0-\u06F9]/g, char => persianToEnglishMap[char]);

  return Number(converted);
}


window.$docsify.plugins = window.$docsify.plugins.concat(function (hook) {
  hook.beforeEach(function (content) {
    return content.replace(/\.{3}گاهشمار([\s\S]*?)\.{3}/g, function (match, content) {
      let maxWidth = '';
      const lines = content
        .trim()
        .split('\n')
        .map(line => line.trim()) // Trim all lines
        .filter(line => line); // Remove empty lines
      
      const regexNumber = /^[0-9\u06F0-\u06F9]*$/;

      if(regexNumber.test(lines[0])){
        let size = convertToNumber(lines[0]);
        if(size){
          maxWidth = 'style="max-width: '+size+'px;"'
        }
        
      }

      let timelineHTML = '<div class="timeline"><div class="timeline-container" '+maxWidth+' >';
      let currentItem = null;
      
      lines.forEach(line => {
        if (line.startsWith('-')) {
          // If there's an active item, finalize it
          if (currentItem) {
            timelineHTML += `
              <div class="timeline-item">
                <div class="timeline-item-content">
                  ${currentItem.image ? `<div class="box"><div class="image"><img src="${currentItem.image}" alt="Madh Image"></div></div>` : ''}
                  <div class="text">
                    <h3>${marked(currentItem.title)}</h3>
                    <span>${marked(currentItem.date)}</span>
                    ${marked(currentItem.description)}
                  </div>
                </div>
                <div class="timeline-circle"></div>
              </div>
            `;
          }

          // Start a new timeline item
          currentItem = {
            title: line.substring(1).trim(),
            image: '',
            date: '',
            description: ''
          };
        } else if (line.startsWith(':[[')) {
          // Image subdata
          currentItem.image = line.substring(3, line.length - 2).trim();
        } else if (line.startsWith(':سال')) {
          // Date subdata
          currentItem.date = line.substring(1).trim();
        } else if (line.startsWith(':')) {
          // Description subdata
          currentItem.description += line.substring(1) + '\n';
        }
      });

      // Finalize the last item
      if (currentItem) {
        timelineHTML += `
          <div class="timeline-item">
            <div class="timeline-item-content">
              ${currentItem.image ? `<div class="box"><div class="image"><img src="${currentItem.image}" alt="Madh Image"></div></div>` : ''}
              <div class="text">
                <h3>${marked(currentItem.title)}</h3>
                <span>${marked(currentItem.date)}</span>
                ${marked(currentItem.description)}
              </div>
            </div>
            <div class="timeline-circle"></div>
          </div>
        `;
      }

      timelineHTML += '</div></div>';
      return timelineHTML;
    });
  });
});