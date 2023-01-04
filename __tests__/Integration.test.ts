import {Action} from "../src/Action";
import * as github from "@actions/github";
import {Inputs} from "../src/Inputs";
import {GithubReleases, ReleaseData} from "../src/Releases";
import {GithubArtifactUploader} from "../src/ArtifactUploader";
import * as path from "path";
import {FileArtifactGlobber} from "../src/ArtifactGlobber";
import {Outputs} from "../src/Outputs";
import {GithubArtifactDestroyer} from "../src/ArtifactDestroyer";
import {ReleaseActionSkipper} from "../src/ActionSkipper";

// This test is currently intended to be manually run during development. To run:
// - Make sure you have an environment variable named GITHUB_TOKEN assigned to your token
// - Remove skip from the test below
describe.skip('Integration Test', () => {
    let action: Action

    beforeEach(() => {
        const token = getToken()
        const git = github.getOctokit(token)

        const inputs = getInputs()
        const outputs = getOutputs()
        const releases = new GithubReleases(inputs, git)
        const uploader = new GithubArtifactUploader(
            releases,
            inputs.replacesArtifacts,
            inputs.artifactErrorsFailBuild,
        )
        const artifactDestroyer = new GithubArtifactDestroyer(releases)
        const actionSkipper = new ReleaseActionSkipper(inputs.skipIfReleaseExists, releases, inputs.tag)
        
        action = new Action(inputs, outputs, releases, uploader, artifactDestroyer, actionSkipper)
    })

    it('Performs action', async () => {
        await action.perform()
    })

    function getInputs(): Inputs {
        const MockInputs = jest.fn<Inputs, any>(() => {
            return {
                allowUpdates: true,
                artifactErrorsFailBuild: false,
                artifacts: artifacts(),
                createdDraft: false,
                createdReleaseBody: "This release was generated by release-action's integration test",
                createdReleaseName: "Releases Action Integration Test",
                commit: undefined,
                discussionCategory: 'Release',
                generateReleaseNotes: true,
                owner: "ncipollo",
                createdPrerelease: false,
                replacesArtifacts: true,
                replaceReleaseNotes: true,
                removeArtifacts: false,
                repo: "actions-playground",
                skipIfReleaseExists: false,
                tag: "release-action-test",
                token: getToken(),
                updatedDraft: false,
                updatedReleaseBody: "This release was updated by release-action's integration test",
                updatedReleaseName: "Releases Action Integration Test",
                updatedPrerelease: false,
                updateOnlyUnreleased: false
            }
        })
        return new MockInputs();
    }

    function getOutputs(): Outputs {
        const MockOutputs = jest.fn<Outputs, any>(() => {
            return {
                applyReleaseData(releaseData: ReleaseData) {
                    console.log(`Release Data: ${releaseData}`)
                }
            }
        })
        return new MockOutputs()
    }

    function artifacts() {
        const globber = new FileArtifactGlobber()
        const artifactPath = path.join(__dirname, 'Integration.test.ts')
        const artifactString = `~/Desktop,~/Desktop/test.txt,blarg.tx, ${artifactPath}`
        return globber.globArtifactString(artifactString, "raw", false)
    }

    function getToken(): string {
        return process.env.GITHUB_TOKEN ?? ""
    }

})
