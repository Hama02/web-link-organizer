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
  chrome.storage.sync.get({ categories: [], pages: [] }, function (data) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }

    let categories = data.categories;
    let pages = data.pages;
    // Find and remove the category with the specified name
    categories = categories.filter((category) => category !== categoryName);
    let index = null;
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].categories.includes(categoryName)) {
        index = i;
      }
    }
    if (index) {
      if (pages[index].categories.length === 1) {
        pages.splice(index, 1);
      } else {
        pages[index].categories.splice(
          pages[index].categories.indexOf(categoryName),
          1
        );
      }
    }
    // Update the list of categories in storage
    chrome.storage.sync.set(
      { categories: categories, pages: pages },
      function () {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
        // After successfully deleting the category, update the UI to remove it
        refreshCategoryList();
      }
    );
  });
}

// Function to get all opening tabls urls
function bulk() {
  chrome.tabs.query({}, function (tabs) {
    chrome.storage.sync.get({ pages: [] }, function (data) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      const savedPages = data.pages;
      tabs.forEach((tab) => {
        const pageTitle = tab.title;
        const pageUrl = new URL(tab.url);
        const pageDomain = pageUrl.hostname;
        // Combine the domain and title into the suggested name
        const linkName = `${pageDomain} - ${pageTitle}`;
        const pageData = {
          categories: ["Home"],
          linkName,
          url: tab.url,
        };
        // Add the new page data to the array
        savedPages.push(pageData);
      });
      chrome.storage.sync.set({ pages: savedPages }, function () {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
        showCustomAlert("Pages saved successfully.");
      });
    });
  });
}

document.getElementById("bulk").addEventListener("click", bulk);

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
      const div1 = document.createElement("div");
      div1.className = "list";
      div1.draggable = true;
      const div2 = document.createElement("div");
      div2.className = "title";
      const div3 = document.createElement("div");
      div3.className = "icons-container";
      const h2 = document.createElement("h2");
      h2.textContent = category;
      const icon = document.createElement("img");
      icon.src = "./icons/drop.svg";
      icon.className = "drop-icon";
      const delete_icon = document.createElement("img");
      delete_icon.src = "./icons/delete.svg";
      delete_icon.className = "drop-icon";
      delete_icon.addEventListener("click", () => {
        deleteCategory(category);
      });
      icon.addEventListener("click", () => {
        const u = document.querySelector(`.${category}`);
        if (u.classList.contains("hidden")) {
          displaySavedPages();
        }
        u.classList.toggle("hidden");
      });
      div3.append(delete_icon, icon);
      div2.append(h2, div3);
      const ul = document.createElement("ul");
      ul.id = "savedPagesList";
      ul.classList.add(category, "hidden");
      div1.append(div2, ul);
      categoriesList.append(div1);
    }
  });
}

function displaySavedPages() {
  chrome.storage.sync.get({ pages: [], categories: [] }, function (data) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    categories = data.categories;
    categories.forEach((cat) => {
      document.querySelector(`.${cat}`).innerHTML = "";
    });
    const savedPages = data.pages;
    for (const page of savedPages) {
      for (const page_cat of page.categories) {
        const pageList = document.querySelector(`.${page_cat}`);
        if (!pageList) {
          return;
        }
        const li = document.createElement("li");
        const link = document.createElement("a");
        const i = document.createElement("img");
        i.src = "./icons/edit.svg";
        i.className = "edit-icon";
        link.textContent = `${page.linkName}`;
        link.href = page.url;
        link.target = "_blank"; // Open link in a new tab
        link.style.width = "268px";

        const deleteIcon = document.createElement("img");
        deleteIcon.src = "./icons/delete.png";
        deleteIcon.className = "delete-icon";

        // Initially hide the delete icon
        deleteIcon.style.opacity = 0;

        // Add a click event to delete the saved page
        deleteIcon.addEventListener("click", () => {
          const pageIndex = savedPages.findIndex(
            (savedPage) => savedPage.url === page.url
          );
          if (pageIndex !== -1) {
            savedPages[pageIndex].categories.splice(
              savedPages[pageIndex].categories.indexOf(page_cat),
              1
            );
            if (savedPages[pageIndex].categories.length == 0) {
              savedPages.splice(pageIndex, 1);
            }
            chrome.storage.sync.set({ pages: savedPages }, () => {
              refreshCategoryList(); // Re-display the updated saved pages
            });
          }
        });

        i.addEventListener("click", () => {
          displayEditContent();
          editPage(page);
        });
        li.addEventListener("mouseenter", () => {
          deleteIcon.style.opacity = 1;
          deleteIcon.style.transition = "opacity 0.3s ease"; // Smooth transition
        });
        li.addEventListener("mouseleave", () => {
          deleteIcon.style.opacity = 0;
        });

        li.append(link, i, deleteIcon);
        pageList.append(li);
      }
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
  const linkName = document.getElementById("linkName").value;
  if (linkName === "") {
    showCustomAlert("Page Already Saved!");
    return;
  }
  // Get the URL from the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const pageUrl = tabs[0].url;
    // Prepare the data for the new page
    const pageData = {
      categories: ["Home"],
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
        document.getElementById("linkName").value = "";
      });
    });
  });
}
// Function to display saved pages content
function displaySavedPagesContent() {
  document.getElementById("savedPagesContent").style.display = "block";
  document.querySelector(".container").style.display = "none";
  document.getElementById("editPageContent").style.display = "none";
}

// Function to display popup content
function displayPopupContent() {
  document.getElementById("savedPagesContent").style.display = "none";
  document.querySelector(".container").style.display = "block";
  document.getElementById("editPageContent").style.display = "none";
}

// Function to display edit page content
function displayEditContent() {
  document.getElementById("savedPagesContent").style.display = "none";
  document.querySelector(".container").style.display = "none";
  document.getElementById("editPageContent").style.display = "block";
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

function editPage(page) {
  const cat_check = document.querySelector(".checkbox_container");
  cat_check.innerHTML = "";
  chrome.storage.sync.get({ categories: [] }, function (data) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    for (const category of data.categories) {
      const div = document.createElement("div");
      div.className = "checkbox";
      const input = document.createElement("input");
      const label = document.createElement("label");
      input.type = "checkbox";
      input.name = "checkbox";
      input.value = category;
      label.textContent = category;
      div.append(input, label);
      cat_check.appendChild(div);
      page.categories.includes(category) ? (input.checked = true) : "";
    }
  });
  const linkname_input = document.querySelector("#linkname");
  const url_input = document.querySelector("#url");
  linkname_input.value = page.linkName;
  url_input.value = page.url;
}

function saveChanges() {
  const url = document.querySelector("#url").value;
  const linkname = document.querySelector("#linkname").value;
  chrome.storage.sync.get({ pages: [] }, function (data) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    const { pages } = data;
    const updated_pages = pages.map((page) => {
      if (page.url === url) {
        page.linkName = linkname;
        let checkboxes = document.querySelectorAll('input[name="checkbox"]');
        checkboxes.forEach((box) => {
          if (box.checked) {
            page.categories.includes(box.value)
              ? ""
              : page.categories.push(box.value);
          } else {
            page.categories.includes(box.value)
              ? page.categories.splice(page.categories.indexOf(box.value), 1)
              : "";
          }
        });
      }
      return page;
    });
    chrome.storage.sync.set({ pages: updated_pages }, function () {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      showCustomAlert("Updated Successfully!");
    });
    displaySavedPages();
  });
}

document.querySelector("#save-edit").addEventListener("click", saveChanges);

// Add a click event listener to the "View Saved Pages" button
document
  .getElementById("viewSavedPagesButton")
  .addEventListener("click", displaySavedPagesContent);

document
  .getElementById("return-btn")
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

document.addEventListener("DOMContentLoaded", refreshCategoryList);

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get({ categories: [] }, function (data) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    const categories = data.categories;
    categories.includes("Home") ? "" : addCategory("Home");
  });
});
