document.getElementById('command').addEventListener("focus", () => {
  document.getElementById('commandline').classList.add("border-focus");
});

document.getElementById('command').addEventListener("blur", () => {
  document.getElementById('commandline').classList.remove("border-focus");
});

document.querySelector('#darkModeToggle input[type=checkbox]').addEventListener("click", () => {
  const cb = document.querySelector('#darkModeToggle input[type="checkbox"]');
  if (cb.checked) {
    document.body.classList.remove("night-mode");
  } else {
    document.body.classList.add("night-mode");
  }
});

var isMenuOpen = false;
document.getElementById('menuToggle').addEventListener("click", () => {
  isMenuOpen = !isMenuOpen;
  const menu = document.getElementById('menu');
  const toggle = document.getElementById('menuToggle');

  if (isMenuOpen) {
    menu.style.right = "0";
    toggle.style.transform = "rotate(180deg)";
  } else {
    menu.style.right = "-" + menu.offsetWidth + "px";
    toggle.style.transform = "none";
  }
});
