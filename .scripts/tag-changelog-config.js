module.exports = {
  types: [
    { types: ["feat", "feature"], label: "🎉 New Features" },
    { types: ["fix", "bugfix"], label: "🐛 Bugfixes" },
    { types: ["improvements", "enhancement"], label: "🔨 Improvements" },
    { types: ["perf"], label: "🏎️ Performance Improvements" },
    { types: ["build", "ci"], label: "🏗️ Build System" },
    { types: ["refactor"], label: "🪚 Refactors" },
    { types: ["doc", "docs"], label: "📚 Documentation Changes" },
    { types: ["test", "tests"], label: "🔍 Tests" },
    { types: ["style"], label: "💅 Code Style Changes" },
    { types: ["chore"], label: "🧹 Chores" },
    { types: ["other"], label: "Other Changes" }
  ],

  excludeTypes: ["other"],

  capitalizeFirstLetter: function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  },

  renderTypeSection: function (label, commits) {
    let text = `\n## ${label}\n`

    commits.forEach((commit) => {
      const capitalizedSubject = this.capitalizeFirstLetter(commit.subject)
      text += `- ${capitalizedSubject} ${commit.sha.slice(0, 7)}\n`
    })

    return text
  },

  renderChangelog: function (release, changes) {
    const now = new Date()
    return (
      `# ${release} - ${now.toISOString().substr(0, 10)}\n` + changes + "\n\n"
    )
  }
}