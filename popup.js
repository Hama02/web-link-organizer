// Function to add a new category
function addCategory(categoryName) {
  // Get the current list of categories from storage
  chrome.storage.sync.get({ categories: [] }, function (data) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    const categories = data.categories;
    categories.push(categoryName);

    // Update the list of categories in storage
    chrome.storage.sync.set({ categories: categories }, function () {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }

      // After successfully adding the new category, update the UI to display it
      refreshCategoryList();
    });
  });
}

// Function to delete a category by name
function deleteCategory(categoryName) {
  // Get the current list of categories from storage
  chrome.storage.sync.get({ categories: [] }, function (data) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    let categories = data.categories;
    // Find and remove the category with the specified name
    categories = categories.filter((category) => category !== categoryName);

    // Update the list of categories in storage
    chrome.storage.sync.set({ categories: categories }, function () {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }

      // After successfully deleting the category, update the UI to remove it
      refreshCategoryList();
    });
  });
}

// Handle user input to create a new category
document
  .getElementById("createCategoryButton")
  .addEventListener("click", function () {
    const newCategory = document.getElementById("newCategory").value;

    if (newCategory.trim() !== "") {
      addCategory(newCategory);
    } else {
      showCustomAlert("Please Provide a Valid Category");
    }
  });

// Function to refresh the category list in the UI
function refreshCategoryList() {
  chrome.storage.sync.get({ categories: [] }, function (data) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    const categories = data.categories;
    const categoriesList = document.getElementById("categoriesList");
    categoriesList.innerHTML = "";

    for (const category of categories) {
      const li = document.createElement("li");
      li.textContent = category;

      // Create a delete button for each category
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.classList.add("delete");
      deleteButton.addEventListener("click", function () {
        deleteCategory(category); // Handle category deletion
      });
      li.addEventListener("click", function () {
        document.getElementById("category").value = category;
      });
      li.appendChild(deleteButton);
      categoriesList.appendChild(li);
    }
  });
}

// Function to suggest a link name based on the page's author and post title
function suggestLinkName() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];

    // Extract the page title and domain
    const pageTitle = tab.title;
    const pageUrl = new URL(tab.url);
    const pageDomain = pageUrl.hostname;

    // Combine the domain and title into the suggested name
    const suggestedName = `${pageDomain} - ${pageTitle}`;

    // Update the input field with the suggested name
    document.getElementById("linkName").value = suggestedName;
  });
}

// Function to handle saving the page
function savePage() {
  const category = document.getElementById("category").value.trim();
  const linkName = document.getElementById("linkName").value;

  // Check if the category input is empty
  if (category === "") {
    showCustomAlert("Please specify a category before saving.");
    return;
  }

  // Get the URL from the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const pageUrl = tabs[0].url;

    // Prepare the data for the new page
    const pageData = {
      category: category,
      linkName: linkName,
      url: pageUrl, // Include the URL in the data
    };

    // Retrieve the current list of saved pages or initialize an empty array
    chrome.storage.sync.get({ pages: [] }, function (data) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }

      const savedPages = data.pages;

      // Add the new page data to the array
      savedPages.push(pageData);

      // Update the list of saved pages in storage
      chrome.storage.sync.set({ pages: savedPages }, function () {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }

        // Inform the user that the page has been saved
        showCustomAlert("Page saved successfully.");

        // Clear the category and link name fields
        document.getElementById("category").value = "";
        document.getElementById("linkName").value = "";
        displaySavedPages();
      });
    });
  });
}

// Function to load and display saved pages
function displaySavedPages() {
  chrome.storage.sync.get({ pages: [] }, function (data) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    const savedPages = data.pages;
    const savedPagesList = document.getElementById("savedPagesList");

    savedPagesList.innerHTML = "";

    for (const [index, page] of savedPages.entries()) {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.textContent = `-${page.category} - ${page.linkName}`;
      link.href = page.url;
      link.target = "_blank"; // Open link in a new tab

      const deleteIcon = document.createElement("img");
      deleteIcon.src = "./icons/delete.png";
      deleteIcon.className = "delete-icon";

      // Initially hide the delete icon
      deleteIcon.style.opacity = 0;

      // Add a click event to delete the saved page
      deleteIcon.addEventListener("click", () => {
        savedPages.splice(index, 1); // Remove the saved page from the array
        chrome.storage.sync.set({ pages: savedPages }, () => {
          displaySavedPages(); // Re-display the updated saved pages
        });
      });

      li.addEventListener("mouseenter", () => {
        deleteIcon.style.opacity = 1;
        deleteIcon.style.transition = "opacity 0.3s ease"; // Smooth transition
      });
      li.addEventListener("mouseleave", () => {
        deleteIcon.style.opacity = 0;
      });

      li.appendChild(link);
      li.appendChild(deleteIcon);
      savedPagesList.appendChild(li);
    }
  });
}
// Call the function to display saved pages when the page loads
document.addEventListener("DOMContentLoaded", displaySavedPages);

// Function to display saved pages content
function displaySavedPagesContent() {
  document.getElementById("savedPagesContent").style.display = "block";
  document.querySelector(".container").style.display = "none";
}

// Function to display popup content
function displayPopupContent() {
  document.getElementById("savedPagesContent").style.display = "none";
  document.querySelector(".container").style.display = "block";
}

// Function to show a custom alert
function showCustomAlert(message) {
  const alertElement = document.getElementById("customAlert");
  const alertMessage = document.getElementById("alertMessage");
  const alertCloseButton = document.getElementById("alertCloseButton");

  alertMessage.textContent = message;
  alertElement.style.display = "block";

  // Close the alert when the close button is clicked
  alertCloseButton.addEventListener("click", function () {
    alertElement.style.display = "none";
  });
}

// Add a click event listener to the "View Saved Pages" button
document
  .getElementById("viewSavedPagesButton")
  .addEventListener("click", displaySavedPagesContent);

// Add a click event listener to the "Return to Popup" button
document
  .getElementById("returnButton")
  .addEventListener("click", displayPopupContent);

// Add a click event listener to the save button
document.getElementById("saveButton").addEventListener("click", savePage);

// Call the suggestLinkName function when the popup HTML is loaded
document.addEventListener("DOMContentLoaded", suggestLinkName);
// Call the refreshCategoryList function when the popup opens
document.addEventListener("DOMContentLoaded", refreshCategoryList);
