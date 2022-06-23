// License: MIT
declare module '@npmcli/arborist' {
  export interface Node {
    name: string
    package: {
      name:string,
      version:string
      license: string
    }
    children: Node[]
  }
  export class Arborist {
    constructor(args?:{})
  
    loadActual(): Promise<Node>
  }
}