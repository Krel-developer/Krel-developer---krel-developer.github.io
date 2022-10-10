import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import krelFundingAbi from '../contract/krelFunding.abi.json'
import erc20Abi from '../contract/erc20.abi.json'

const ERC20_DECIMALS = 18
const MPContractAddress = '0x32A3Fb86CfE921F679aE79a916605D8C39205880'
const cUSDContractAddress = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'

let kit
let contract
let projects = []

document.addEventListener('DOMContentLoaded', async function () {
  notification('Loading...', true)
  initFront()
  await connectCeloWallet()
  await getBalance()
  await getProjects()
  notificationClose()
})

function projectTemplate(p) {
  return `
    <div class="card">
      <div class="card-image">
        <img
          src="${p.img}"
        />
      </div>
      <div class="card-content">
        <p>
          ${p.name}
        </p>
      </div>
      <div class="card-action center-align">
        <a class="waves-effect waves-light btn about-btn" data-index="${p.index}">About</a>
      </div>
    </div>
  `
}

function ownProjectTemplate(p) {
  const btnTemplate = `
      ${
        p.canWithdraw
          ? ''
          : 'You can withdraw only after reaching the goal <br><br>'
      }
      <div 
        class="waves-effect waves-light btn withdraw-btn" 
        data-index="${p.index}"
        ${p.canWithdraw ? '' : 'disabled'} 
      >
        withdraw
      </div>
      
    `
  return `
    <div class="card">
      <div class="card-content">
        <h4>${p.name}</h4>
        ${goalTempalte(p)}
      </div>
      <div class="card-action">
          ${p.isWithdraw ? 'You already withdraw' : btnTemplate}
      </div>
    </div>
  `
}

function modalTempalte(p) {
  let donateBlock
  if (p.isWithdraw) {
    donateBlock = `
      The goal has been achieved, donations are closed, thanks to everyone
      who supported the project.
    `
  } else if (kit.defaultAccount === p.owner) {
    donateBlock = `
      You cannot donate to this project because it is your own.
    `
  } else {
    donateBlock = `
      Amount of your donate (cUSD):
      <input type="number" id="amountOfDonate" value="1">
      <div class="waves-effect waves-light btn donate" data-id="${p.index}">Donate</div>
    `
  }
  return `
    <h4>${p.name}</h4>
    <div class="owner">
      owner: 
      <a 
        href="https://alfajores-blockscout.celo-testnet.org/address/${
          p.owner
        }/transactions" 
        target="_blank"
      >
        ${p.owner}
      </a>
    </div>
    <p>${p.description}</p>
    ${goalTempalte(p)}
    <div class=" donate-block">
      ${donateBlock}
    </div>
   
    
    
  `
}

function goalTempalte(p) {
  return `
    <div class="goal">
      <div class="progress-bar">
        <span style="width: ${p.widthProgressBar}"></span>
      </div>
      <div class="current-value">${p.current
        .shiftedBy(-ERC20_DECIMALS)
        .toFixed(2)} cUSD</div>
      pledged of cUSD <span class="goal-value">${p.goal
        .shiftedBy(-ERC20_DECIMALS)
        .toFixed(2)}</span> cUSD
      goal
    </div>
  `
}

function initFront() {
  // init tabs (PROJECTS and MY PROJECTS)
  const instanceTabs = M.Tabs.init(document.querySelector('.tabs'))

  // init about modal
  const $modalAbout = document.getElementById('modal-about')
  const $modalAboutContent = $modalAbout.querySelector('.modal-content')
  M.Modal.init($modalAbout)
  const instanceModalAbout = M.Modal.getInstance($modalAbout)

  document.getElementById('project').addEventListener('click', (e) => {
    if (e.target.className.includes('about-btn')) {
      $modalAboutContent.textContent = ''
      $modalAboutContent.insertAdjacentHTML(
        'afterbegin',
        modalTempalte(projects[e.target.dataset.index])
      )
      instanceModalAbout.open()
    }
  })
  $modalAbout.addEventListener('click', (e) => {
    if (e.target.className.includes('donate')) {
      donate(e.target.dataset.id, instanceModalAbout)
    }
  })

  // init form modal
  M.Modal.init(document.getElementById('modal-form'))

  // init add new project button
  document
    .querySelector('#modal-form .btn')
    .addEventListener('click', addNewProject)

  // init withdraw function
  document.querySelector('.main').addEventListener('click', withdraw)

  // init close modal  button
  document
    .querySelector('.notice-close')
    .addEventListener('click', notificationClose)
}

const connectCeloWallet = async function () {
  if (window.celo) {
    notification('⚠️ Please approve this DApp to use it.')
    try {
      await window.celo.enable()
      notification('Loading...', true)
      const web3 = new Web3(window.celo)
      kit = newKitFromWeb3(web3)

      const accounts = await kit.web3.eth.getAccounts()
      kit.defaultAccount = accounts[0]

      contract = new kit.web3.eth.Contract(krelFundingAbi, MPContractAddress)
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  } else {
    notification('⚠️ Please install the CeloExtensionWallet.')
  }
}

const approve = async function (_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

  const result = await cUSDContract.methods
    .approve(MPContractAddress, _price)
    .send({ from: kit.defaultAccount })
  return result
}

const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
  document.querySelector('.balance').textContent = cUSDBalance
}

const getProjects = async function () {
  document.querySelector('.main').classList.add('loading')
  const _projectsLength = await contract.methods.getProjectsLength().call()
  const _products = []
  for (let i = 0; i < _projectsLength; i++) {
    let _product = new Promise(async (resolve, reject) => {
      let p = await contract.methods.readProject(i).call()
      resolve({
        index: i,
        owner: p[0],
        name: p[1],
        img: p[2],
        description: p[3],
        goal: new BigNumber(p[4]),
        current: new BigNumber(p[5]),
        isWithdraw: p[6],
        widthProgressBar: +p[5] >= +p[4] ? '100%' : (+p[5] / +p[4]) * 100 + '%',
        canWithdraw: p[5] >= p[4],
      })
    })
    _products.push(_product)
  }
  projects = await Promise.all(_products)
  renderProducts()
  document.querySelector('.main').classList.remove('loading')
}

function renderProducts() {
  document.getElementById('project-wrapper').innerHTML = ''
  document.getElementById('my-project-wrapper').innerHTML = ''
  projects.forEach((_product) => {
    const project = document.createElement('div')
    project.className = 'col s12 l4 m6'
    project.innerHTML = projectTemplate(_product)
    document.getElementById('project-wrapper').appendChild(project)
    if (kit.defaultAccount === _product.owner) {
      const ownProject = document.createElement('div')
      ownProject.className = 'col s12 l4 m6'
      ownProject.innerHTML = ownProjectTemplate(_product)
      document.getElementById('my-project-wrapper').appendChild(ownProject)
    }
  })
}

function notification(_text, inProgress = false) {
  document.querySelector('.notice-text').textContent = _text
  document.querySelector('.notice').style.display = 'block'

  // if parameter inProgress = true added progress bar

  if (inProgress) {
    document.querySelector('.notice-text').insertAdjacentHTML(
      'beforeend',
      `
      <div class="progress">
        <div class="indeterminate"></div>
      </div>
    `
    )
  }
}
function notificationClose() {
  document.querySelector('.notice').style.display = 'none'
}

// function for adding new projects

const addNewProject = async function () {
  const data = [
    document.getElementById('projectName').value,
    document.getElementById('projectImgUrl').value,
    document.getElementById('projectDescription').value,
    new BigNumber(document.getElementById('projectGoal').value)
      .shiftedBy(ERC20_DECIMALS)
      .toString(),
  ]
  const instanceModalForm = M.Modal.getInstance(
    document.getElementById('modal-form')
  )
  instanceModalForm.close()
  notification(`Adding "${data[0]}"...`, true)

  try {
    const result = await contract.methods
      .createProject(...data)
      .send({ from: kit.defaultAccount })
  } catch (error) {
    notification(`⚠️ ${error}.`)
  }
  notification(`🎉 You successfully added "${data[0]}".`)
  getProjects()
}

// function for withdraw

const withdraw = async function (e) {
  const index = e.target.dataset.index
  if (e.target.className.includes('withdraw-btn')) {
    notification(
      `Awaiting withdraw ${projects[index].current
        .shiftedBy(-ERC20_DECIMALS)
        .toFixed(2)} cUSD from "${projects[index].name}".`,
      true
    )
    try {
      const result = await contract.methods
        .withdraw(index)
        .send({ from: kit.defaultAccount })

      notification(
        `🎉 You withdraw ${projects[index].current
          .shiftedBy(-ERC20_DECIMALS)
          .toFixed(2)} cUSD from "${projects[index].name}".`
      )
      getProjects()
      getBalance()
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
  }
}

const donate = async function (index, instanceModalAbout) {
  const amountValue = document.getElementById('amountOfDonate').value
  const amount = new BigNumber(amountValue)

  notification(' Waiting for donate approval...', true)
  try {
    await approve(amount.shiftedBy(ERC20_DECIMALS).toString())
  } catch (error) {
    notification(`⚠️ ${error}.`)
  }
  notification(
    ` Awaiting donate ${amountValue}  cUSD for "${projects[index].name}"...`,
    true
  )
  try {
    const result = await contract.methods
      .donateForProject(index, amount.shiftedBy(ERC20_DECIMALS).toString())
      .send({ from: kit.defaultAccount })
    instanceModalAbout.close()
    notification(
      `🎉 You successfully donate ${amountValue}  cUSD for "${projects[index].name}".`
    )
    getProjects()
    getBalance()
  } catch (error) {
    notification(`⚠️ ${error}.`)
  }
}
