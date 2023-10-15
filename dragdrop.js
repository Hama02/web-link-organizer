document.addEventListener("DOMContentLoaded", function () {
  var draggedItem = null;
  var categoriesList = document.getElementById("categoriesList");

  // Add event listeners for drag-and-drop to the parent element (categoriesList)
  categoriesList.addEventListener("dragstart", handleDragStart);
  categoriesList.addEventListener("dragover", handleDragOver);
  categoriesList.addEventListener("drop", handleDrop);

  function handleDragStart(e) {
    draggedItem = e.target;
    e.dataTransfer.setData("text/plain", null);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    if (draggedItem) {
      const dropTarget = e.target;
      if (dropTarget.classList.contains("list")) {
        const rect = dropTarget.getBoundingClientRect();
        const mouseY = e.clientY;
        const targetY = rect.top + rect.height / 2;

        if (mouseY < targetY) {
          categoriesList.insertBefore(draggedItem, dropTarget);
        } else {
          categoriesList.insertBefore(
            draggedItem,
            dropTarget.nextElementSibling
          );
        }
      }
      draggedItem = null;
    }
  }
});
