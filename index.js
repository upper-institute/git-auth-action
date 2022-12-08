const exec = require('@actions/exec')
const core = require('@actions/core')
const fs = require('fs').promises
const path = require('path')
const os = require('os')

const addHostKey = async (host) => {

    let doSshKeyscanStdout = ''
    let doSshKeyscanStderr = ''

    const exitCode = await exec.exec('ssh-keyscan', ['-H', host], {
        silent: true,
        ignoreReturnCode: true,
        listeners: {
            stdout: (data) => {
                doSshKeyscanStdout += data.toString()
            },
            stderr: (data) => {
                doSshKeyscanStderr += data.toString()
            }
        }
    })

    if (exitCode !== 0) {
        core.debug(doSshKeyscanStdout)
        throw new Error(`Failed to add host ${host}: ${doLoginStderr}`)
    }

    const knownHosts = path.join(os.homedir(), '.ssh', 'known_hosts')

    await fs.appendFile(knownHosts, doSshKeyscanStdout, 'utf-8')
}

const chmodPrivateKey = async (pkPath) => {

    let doChmodStdout = ''
    let doChmodStderr = ''

    const exitCode = await exec.exec('sudo', ['chmod', '600', pkPath], {
        silent: true,
        ignoreReturnCode: true,
        listeners: {
            stdout: (data) => {
                doChmodStdout += data.toString()
            },
            stderr: (data) => {
                doChmodStderr += data.toString()
            }
        }
    })

    if (exitCode !== 0) {
        core.debug(doChmodStdout)
        throw new Error(`Failed to chmod private key ${pkPath}: ${doLoginStderr}`)
    }

}

async function main() {
    try {

        const sshHomePath = path.join(os.homedir(), '.ssh')
        const gitHomePath = path.join(os.homedir(), '.git')

        await fs.mkdir(sshHomePath, {recursive: true})
        await fs.mkdir(gitHomePath, {recursive: true})

        const hosts = core.getMultilineInput('hosts')
        const privateKeys = core.getMultilineInput('privateKeys').map(line => line.split('=', 2))
        const repositories = core.getMultilineInput('repositories').map(line => line.split(',', 3))

        for (let host of hosts) {
            core.info(`Adding host to known hosts: ${host}`)
            await addHostKey(host)
        }

        for (let [name, privateKey] of privateKeys) {

            core.info(`Adding SSH private key: ${name}`)

            const keyFile = path.join(os.homedir(), '.ssh', name)

            await fs.writeFile(keyFile, privateKey, 'utf-8')

            await chmodPrivateKey(keyFile)

        }

        const sshConfig = []
        const gitConfig = []

        for (let [repo, host, pkName] of repositories) {

            const repoDomain = repo.split('/').join('-').replace('.git', '')

            const sshEndpoint = `ssh://git@${repoDomain}:${repo}`

            core.info(`Configuring authentication for repository: "${sshEndpoint}"`)

            sshConfig.push(
                `Host ${repoDomain}`,
                `        User git`,
                `        Hostname ${host}`,
                `        PreferredAuthentications publickey`,
                `        IdentityFile ${path.join(os.homedir(), '.ssh', pkName)}`,
                `        IdentitiesOnly yes`,
                '',
            )

            gitConfig.push(
                '[remote "origin"]',
                `        url = "${sshEndpoint}"`,
                ''
            )

        }

        const sshConfigFile = path.join(os.homedir(), '.ssh', 'config')

        await fs.appendFile(sshConfigFile, sshConfig.join('\n'), 'utf-8')

        const gitConfigFile = path.join(os.homedir(), '.git', 'config')

        await fs.appendFile(gitConfigFile, gitConfig.join('\n'), 'utf-8')


    } catch (error) {
        core.setFailed(error.message)
    }


}

main().catch(core.setFailed)