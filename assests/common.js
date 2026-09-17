// Shared interaction helpers for Socials by Lucybelle client tools.
// Powers pill-selector groups and quick-pick chips. No dependencies.

function initPillGroups() {
  document.querySelectorAll('.pill-group').forEach(function (group) {
    var targetId = group.dataset.target;
    var hiddenInput = document.getElementById(targetId);
    if (!hiddenInput) return;
    group.querySelectorAll('.pill-option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        group.querySelectorAll('.pill-option').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        hiddenInput.value = btn.dataset.value || btn.textContent.trim();
      });
    });
  });
}

function initChipHints() {
  document.querySelectorAll('.chip-hint').forEach(function (hint) {
    var targetId = hint.dataset.target;
    var input = document.getElementById(targetId);
    if (!input) return;
    hint.querySelectorAll('.chip-pick').forEach(function (btn) {
      btn.addEventListener('click', function () {
        input.value = btn.textContent.trim();
        input.focus();
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initPillGroups();
  initChipHints();
});
