import { Module } from "@medusajs/framework/utils";
import BuildConfigurationModuleService from "./service";

export const BUILD_CONFIGURATION_MODULE = "build_configuration";

export default Module(BUILD_CONFIGURATION_MODULE, {
  service: BuildConfigurationModuleService,
});
