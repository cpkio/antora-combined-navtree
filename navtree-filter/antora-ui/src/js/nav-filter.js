document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('nav-filter-input')
    const searchClear = document.getElementById('nav-filter-clear')
    const itemList = document.getElementById('itemList')

    function filterList(e) {
        console.log('event', e)
        if (e.type == 'click') e.target.value = ''
        if (e.key == 'Escape') e.target.value = ''
        const searchTerm = e.target.value.toLowerCase()
        const items = itemList.getElementsByTagName('li')

        Array.from(items).forEach(item => {
            const itemText = item.textContent.toLowerCase()

            if (searchTerm.length >= 3) {
              if (itemText.includes(searchTerm)) {
                  item.style.display = 'block'
                  item.classList.add('is-active')
              } else {
                  item.style.display = 'none'
              }
            } else {
                item.style.display = null
                if (
                  !(item.classList.contains('is-current-path') || item.classList.contains('is-current-page'))
                ) item.classList.remove('is-active')
            }
        })
    }

    searchInput.addEventListener('keydown', (e) => filterList(e) )
    searchClear.addEventListener('click',   (e) => {
      searchInput.value = ''
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.focus();
  })
    searchInput.addEventListener('input', filterList);
});

