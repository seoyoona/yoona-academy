# Pre-commit

 Using the pre-commit git hooks to ensure checks before committing.

 &middot;
 &middot;
 &middot;

 &times;

 Subscribe

## Intuition

Before performing a commit to our local repository, there are a lot of items on our mental todo list, ranging from styling, formatting, testing, etc. And it's very easy to forget some of these steps, especially when we want to "push to quick fix". To help us manage all these important steps, we can use pre-commit hooks, which will automatically be triggered when we try to perform a commit. These hooks can ensure that certain rules are followed or specific actions are executed successfully and if any of them fail, the commit will be aborted.

## Installation

We'll be using the [Pre-commit](https://pre-commit.com/) framework to help us automatically perform important checks via hooks when we make a commit.

>

We'll start by installing and autoupdating pre-commit (we only have to do this once).

```
# Inside .pre-commit-config.yaml
...
- id: check-added-large-files
 args: ['--maxkb=1000']
 exclude: "notebooks"
...
```

>

Be sure to explore the many other [built-in hooks](https://github.com/pre-commit/pre-commit-hooks) because there are some really useful ones that we use in our project. For example, `check-merge-conflict` to see if there are any lingering merge conflict strings or `detect-aws-credentials` if we accidentally left our credentials exposed in a file, and so much more.

And we can also exclude certain files from being processed by the hooks by using the optional *exclude* key. There are many other [optional keys](https://pre-commit.com/#pre-commit-configyaml---hooks) we can configure for each hook ID.

```
# Inside .pre-commit-config.yaml
...
- id: check-yaml
 exclude: "mkdocs.yml"
...
```

### Custom

Besides pre-commit's built-in hooks, there are also many custom, 3rd party [popular hooks](https://pre-commit.com/hooks.html) that we can choose from. For example, if we want to apply formatting checks with Black as a hook, we can leverage Black's pre-commit hook.

```
# Inside .pre-commit-config.yaml
...
- repo: https://github.com/psf/black
 rev: 20.8b1
 hooks:
 - id: black
 args: []
 files: .
...
```

This specific hook is defined under a [.pre-commit-hooks.yaml](https://github.com/psf/black/blob/master/.pre-commit-hooks.yaml) inside Black's repository, as are other custom hooks under their respective package repositories.

### Local

We can also create our own local hooks without configuring a separate .pre-commit-hooks.yaml. Here we're defining two pre-commit hooks, `test-non-training` and `clean`, to run some commands that we've defined in our Makefile. Similarly, we can run any entry command with arguments to create hooks very quickly.

```
# Inside .pre-commit-config.yaml
...
- repo: local
 hooks:
 - id: clean
 name: clean
 entry: make
 args: ["clean"]
 language: system
 pass_filenames: false
```

## Commit

Our pre-commit hooks will automatically execute when we try to make a commit. We'll be able to see if each hook passed or failed and make any changes. If any of the hooks fail, we have to fix the errors ourselves or, in many instances, reformatting will occur automatically.

check yaml..............................................PASSED
clean...................................................FAILED

In the event that any of the hooks failed, we need to `add` and `commit` again to ensure that all hooks are passed.

```
@article{madewithml,
 author = {Goku Mohandas},
 title = { Pre-commit - Made With ML },
 howpublished = {\url{https://madewithml.com/}},
 year = {2023}
}
```
