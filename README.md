# Git Auth Action

Action to configure host machine authentication for git repositories servers.

## Inputs

### `hosts`

**Required** The name of the person to greet. Default `"World"`.

### `privateKeys`

**Required** Path of the parameter (according to driver specification).

### `repositories`

Prefix for environment variables, example `"VARS_"`. Default `""`.

## Outputs

No outputs are set.

## Example usage

```yaml
name: Configure Git repositories SSH authentication
uses: upper-institute/git-auth-action@v1
with:
  hosts: |
    github.com
    work.github.com
  privateKeys: |
    id_repo_1=${{ secrets.Repo1DeployKey }}
    id_repo_2=${{ secrets.Repo2DeployKey }}
  repositories: |
    myuser/repo1.git,github.com,id_repo_1
    work/repo2.git,work.github.com,id_repo_2
```

And then you can clone your repositories using ssh:

```bash
git clone ssh://git@myuser-repo1:myuser/repo1.git
git clone ssh://git@work-repo2:work/repo2.git
```

Or using the [actions/checkout](https://github.com/actions/checkout) action:

```yaml
name: Checkout repo1
  run: |
    git clone ssh://git@myuser-repo1:myuser/repo1.git -b main --depth 0 repo1
    git clone ssh://git@work-repo2:work/repo2.git -b main --depth 0 repo1
```
