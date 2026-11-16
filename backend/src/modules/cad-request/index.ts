import { Module } from "@medusajs/framework/utils"
import CadRequestModuleService from "./service"

export const CAD_REQUEST_MODULE = "cad_request"

export default Module(CAD_REQUEST_MODULE, { service: CadRequestModuleService })
